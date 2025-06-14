const ProductItem = require('../models/ProductItem')
const Order = require('../models/Order')
const { Sequelize } = require('sequelize');
const ApiResponse = require('../response/ApiResponse')
const OrderItem = require('../models/OrderItem')
const ErrorResponse = require('../response/ErrorResponse')
const User = require('../models/User')
// const Cart = require('../models/Cart')
const Product = require('../models/Product')
const Color = require('../models/Color')
const Size = require('../models/Size')
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem')
const { Op } = require('sequelize');
const Address = require('../models/Address'); // 👈 THÊM DÒNG NÀY



class OrderController {

    async getAllOrder(req, res, next) {
        try {
            const { id: userId, role } = req.user;
            let orders;
            console.log('User gửi request:', req.user);


            // Nếu là admin/owner thì lấy tất cả đơn hàng
            if (role === 'Admin') {
                orders = await Order.findAll({
                    include: [
                        {
                            model: OrderItem,
                            as: 'items',
                            include: [{
                                model: ProductItem,
                                as: 'productItem',
                                include: [
                                    {
                                        model: Product,
                                        as: 'product',
                                        attributes: ['id', 'name']
                                    },
                                    {
                                        model: Color,
                                        as: 'color',
                                        attributes: ['name']
                                    },
                                    {
                                        model: Size,
                                        as: 'size',
                                        attributes: ['name']
                                    }
                                ]
                            }]
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'email'],
                            as: 'user'
                        }
                    ],
                    order: [['createDate', 'DESC']]
                });
                // ✅ Log kết quả đơn đầu tiên để kiểm tra
                console.log(JSON.stringify(orders[0], null, 2));
            } else {
                // Nếu là customer thì chỉ lấy đơn hàng của họ
                orders = await Order.findAll({
                    where: {
                        userId: userId
                    },
                    include: [
                        {
                            model: OrderItem,
                            as: 'items',
                            include: [{
                                model: ProductItem,
                                as: 'productItem',
                                include: [
                                    {
                                        model: Product,
                                        as: 'product',
                                        attributes: ['id', 'name']
                                    },
                                    {
                                        model: Color,
                                        as: 'color',
                                        attributes: ['name']
                                    },
                                    {
                                        model: Size,
                                        as: 'size',
                                        attributes: ['name']
                                    }
                                ]
                            }]
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'email'],
                            as: 'user'
                        }
                    ],
                    order: [['createDate', 'DESC']]
                });
            }

            return ApiResponse.success(res, {
                status: 200,
                data: {
                    orders
                }
            });
        } catch (error) {
            console.log('🔴 ERROR:', error);
            next(error);
        }
    }
    async getOrderById(req, res, next) {
        try {
            const { id: userId, role } = req.user;
            const { id: orderId } = req.params;

            let order = null;
            
            // Nếu là Admin, cho phép xem tất cả đơn hàng
            if (role === 'Admin') {
                order = await Order.findOne({
                    where: {
                        id: orderId
                    },
                    include: [
                        {
                            model: OrderItem,
                            as: 'items',
                            include: [{
                                model: ProductItem,
                                as: 'productItem',
                                include: [
                                    {
                                        model: Product,
                                        as: 'product',
                                        attributes: ['id', 'name']
                                    },
                                    {
                                        model: Color,
                                        as: 'color',
                                        attributes: ['colorCode']
                                    },
                                    {
                                        model: Size,
                                        as: 'size',
                                        attributes: ['name']
                                    }
                                ]
                            }]
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'email'],
                            as: 'user'
                        }
                    ]
                });
            } 
            // Xử lý cho Customer
            else if (role === 'Customer') {
                order = await Order.findOne({
                    where: {
                        id: orderId,
                        userId
                    },
                    include: [{
                        model: OrderItem,
                        as: 'items',
                        include: [{
                            model: ProductItem,
                            as: 'productItem',
                            include: [
                                {
                                    model: Product,
                                    as: 'product',
                                    attributes: ['id', 'name']
                                },
                                {
                                    model: Color,
                                    as: 'color',
                                    attributes: ['colorCode']
                                },
                                {
                                    model: Size,
                                    as: 'size',
                                    attributes: ['name']
                                }
                            ]
                        }]
                    }]
                });
            }

            if (!order) {
                throw new ErrorResponse(404, 'Không tìm thấy đơn hàng');
            }

            return new ApiResponse(res, {
                status: 200,
                data: order
            });
        } catch (error) {
            console.error("❌ getOrderById error:", error);
            next(error);
        }
    }
    async getSale(req, res) {
        try {
            const dailyRevenue = await Order.findAll({
                attributes: [
                    [Sequelize.fn('DATE', Sequelize.col('createDate')), 'date'],
                    [Sequelize.fn('SUM', Sequelize.col('total')), 'totalRevenue']
                ],
                group: [Sequelize.fn('DATE', Sequelize.col('createDate'))],
                order: [[Sequelize.fn('DATE', Sequelize.col('createDate')), 'ASC']]
            });
            res.json({ success: true, data: dailyRevenue });
        } catch (error) {
            console.error('Error fetching daily revenue data:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
        }
    }
    async getMonthlyRevenue(req, res) {
        try {
            const monthlyRevenue = await Order.findAll({
                attributes: [
                    [Sequelize.fn('DATE_FORMAT', Sequelize.col('createDate'), '%Y-%m'), 'month'],
                    [Sequelize.fn('SUM', Sequelize.col('total')), 'totalRevenue']
                ],
                group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createDate'), '%Y-%m')],
                order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('createDate'), '%Y-%m'), 'ASC']]
            });
            res.json({ success: true, data: monthlyRevenue });
        } catch (error) {
            console.error('Error fetching monthly revenue data:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
        }
    }
    async getAnnualRevenue(req, res) {
        try {
            const annualRevenue = await Order.findAll({
                attributes: [
                    [Sequelize.fn('YEAR', Sequelize.col('createDate')), 'year'],
                    [Sequelize.fn('SUM', Sequelize.col('total')), 'totalRevenue']
                ],
                group: [Sequelize.fn('YEAR', Sequelize.col('createDate'))],
                order: [[Sequelize.fn('YEAR', Sequelize.col('createDate')), 'ASC']]
            });
            res.json({ success: true, data: annualRevenue });
        } catch (error) {
            console.error('Error fetching annual revenue data:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
        }
    }


    async createOrder(req, res, next) {
        try {
          console.log('🟡 DỮ LIỆU TỪ FRONTEND:', req.body);
          const { id: userId } = req.user;
          console.log('🟢 userId:', userId);
          const {
            total,
            total_discount = 0,
            email,
            paymentMethod,
            orders_item,
            note
          } = req.body;
      
          if (!Array.isArray(orders_item) || orders_item.length === 0) {
            throw new Error('orders_item phải là một mảng và không được rỗng');
          }
      
          // ✅ Lấy địa chỉ từ bảng Address
          const userAddress = await Address.findOne({ where: { users_id: userId } });
          if (!userAddress) {
            throw new Error('Không tìm thấy địa chỉ của người dùng');
          }
          // Gộp các thành phần địa chỉ lại thành 1 chuỗi đầy đủ
          const fullAddress = `${userAddress.address_line}, ${userAddress.ward}, ${userAddress.district}, ${userAddress.city}`;
          //Lấy thêm tên người nhận và số điện thoại từ địa chỉ để lưu vào đơn hàng
          const fullname = userAddress.name;
          const phone = userAddress.phone;
      
          const total_payable = total - total_discount;
      
          const order = await Order.create({
            total,
            total_discount,
            total_payable,
            phone,
            email,
            fullname,
            address: fullAddress,
            userId: userId, // ✅ Sequelize sẽ tự ánh xạ sang cột `users_id`
            createDate: new Date(),
            status: 'pending',
            statusPayment: paymentMethod === 'cash' ? 'Chưa thanh toán' : 'Đã thanh toán',
            note
          });
          
      
          const createdOrderItems = [];
      
          for (const item of orders_item) {
            const { productItemId, quantity } = item;
      
            if (!productItemId || !quantity) {
              throw new Error('Mỗi sản phẩm trong orders_item cần có productItemId và quantity');
            }
      
            const productItem = await ProductItem.findByPk(productItemId);
            if (!productItem) {
              throw new Error(`Không tìm thấy sản phẩm với ID: ${productItemId}`);
            }
      
            if (productItem.unitInStock < quantity) {
              throw new Error(`Không đủ tồn kho cho sản phẩm ${productItemId}`);
            }
      
            await productItem.update({
              unitInStock: productItem.unitInStock - quantity
            });
      
            const product = await Product.findByPk(productItem.products_id); 

            if (product) {
              await product.update({
                sold: product.sold + quantity
              });
            }
      
            const orderItem = await OrderItem.create({
              orderId: order.id,
              productItemId,
              quantity
            });
      
            createdOrderItems.push(orderItem);
          }
      
          // ✅ Xoá sản phẩm trong giỏ
          const cart = await Cart.findOne({
            where: { users_id: userId, isPaid: false }
          });
      
          if (cart) {
            const productIds = orders_item.map(i => i.productItemId);
          
            console.log('🧹 Xoá CartItem với:', {
              carts_id: cart.id,
              products_item_id: productIds
            });
          
            await CartItem.destroy({
              where: {
                carts_id: cart.id,
                products_item_id: {
                  [Op.in]: productIds     // ✅ Dùng Op.in để lọc mảng
                }
              }
            });
          }
          
      
          return res.status(200).json({
            success: true,
            data: {
              info_order: {
                ...order.dataValues,
                orders_item: createdOrderItems
              },
              message: 'Đặt hàng thành công'
            }
          });
        } catch (err) {
            console.error("❌ Lỗi khi tạo đơn hàng:", err.message);
            console.error(err); // In chi tiết lỗi
          
            return res.status(400).json({
              success: false,
              message: err.message
            });
          }          
      }
      
      


    async deleteOrder(req, res, next) {
    try {
        const { id: orderId } = req.params;

        // 🔥 Bước 1: Xóa tất cả các OrderItem liên quan đến Order này
        await OrderItem.destroy({
            where: {
                orderId: orderId
            }
        });

        // 🔥 Bước 2: Xóa Order
        const deletedOrder = await Order.destroy({
            where: {
                id: orderId
            }
        });

        if (!deletedOrder) {
            throw new ErrorResponse(404, 'Không tìm thấy đơn hàng');
        }

        // ✅ Trả kết quả
        return new ApiResponse(res, {
            status: 200,
            message: 'Xóa đơn hàng thành công'
        });
    } catch (err) {
        next(err);
    }
}


    async cancelOrderById(req, res, next) {
        try {
            const { id: userId, role } = req.user;
            const { id: orderId } = req.params;


            // Tìm đơn hàng theo ID
            const order = await Order.findOne({
                where: {
                    id: orderId
                }
            });

            // Kiểm tra xem đơn hàng có tồn tại không
            if (!order) {
                return ApiResponse.error(res, {
                    status: 404,
                    data: {
                        message: 'Không tìm thấy đơn hàng'
                    }
                });
            }

            // Kiểm tra quyền của người dùng
            if (role === 'Customer' && userId !== order.userId) {
                return ApiResponse.error(res, {
                    status: 403,
                    data: {
                        message: 'Bạn không có quyền hủy đơn hàng của người khác'
                    }
                });
            }

            // Cập nhật trạng thái đơn hàng
            order.status = 'cancelled';
            await order.save();

            // Trả về phản hồi thành công
            return ApiResponse.success(res, {
                status: 200,
                data: {
                    message: 'Cập nhật đơn hàng thành công'
                }
            });
        } catch (err) {
            next(err);
        }
    }
    async setShipperOrder(req, res, next) {
        try {
            const { id: orderId } = req.params;

            // Find the order by ID
            const order = await Order.findOne({
                where: {
                    id: orderId
                }
            });

            // If order is not found, throw an error
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy đơn hàng'
                });
            }

            // Update the order status to 'shipped'
            order.status = 'shipped';
            await order.save();

            // Return success response
            return res.status(200).json({
                success: true,
                data: {
                    message: 'Cập nhật đơn hàng thành công'
                }
            });
        } catch (error) {
            // Catch any unexpected errors and pass them to the next middleware
            next(error);
        }
    }

    async setDeliveredOrder(req, res, next) {
        try {
            const { id: orderId } = req.params;




            // Find the order by ID
            const order = await Order.findOne({
                where: {
                    id: orderId
                }
            });

            // If order is not found, return 404
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy đơn hàng'
                });
            }

            // Update the order status to 'delivered'
            order.status = 'delivered';
            await order.save();

            // Return success response
            return res.status(200).json({
                success: true,
                data: {
                    message: 'Cập nhật đơn hàng thành công'
                }
            });
        } catch (error) {
            console.error('Error updating order status:', error); // Log the error details
            return res.status(500).json({
                success: false,
                message: 'Internal Error.',
                error: error.message
            });
        }
    }
    async setCancelledOrder(req, res, next) {
        try {
            const { id: orderId } = req.params;

            // Find the order by ID
            const order = await Order.findOne({
                where: {
                    id: orderId
                }
            });

            // If order is not found, throw an error
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy đơn hàng'
                });
            }

            // Update the order status to 'shipped'
            order.status = 'cancelled';
            await order.save();

            // Return success response
            return res.status(200).json({
                success: true,
                data: {
                    message: 'Cập nhật đơn hàng thành công'
                }
            });
        } catch (error) {
            // Catch any unexpected errors and pass them to the next middleware
            next(error);
        }
    }
    async setPaymentOrder(req, res, next) {
        try {
            const { id: orderId } = req.params;
            // Find the order by ID
            const order = await Order.findOne({
                where: {
                    id: orderId
                }
            });

            // If order is not found, return 404
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy đơn hàng'
                });
            }
            order.statusPayment = 'paid';
            await order.save();

            // Return success response
            return res.status(200).json({
                success: true,
                data: {
                    message: 'Cập nhật đơn hàng thành công'
                }
            });
        } catch (error) {
            console.error('Error updating order status:', error); // Log the error details
            return res.status(500).json({
                success: false,
                message: 'Internal Error.',
                error: error.message
            });
        }
    }

    async getStatistics(req, res) {
        try {
            // Tính tổng doanh thu từ đơn hàng đã giao và đã thanh toán
            const totalRevenue = await Order.sum('total', {
                where: {
                    status: 'delivered',
                    statusPayment: 'paid'
                }
            });

            console.log('Total Revenue:', totalRevenue); // Log để debug

            // Trả về kết quả
            return res.status(200).json({
                success: true,
                data: {
                    totalRevenue: totalRevenue || 0
                }
            });

        } catch (error) {
            console.error('Error in getStatistics:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                error: error.message
            });
        }
    }
}



module.exports = new OrderController()
