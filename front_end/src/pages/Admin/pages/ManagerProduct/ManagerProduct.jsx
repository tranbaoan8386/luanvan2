import FilterListIcon from "@mui/icons-material/FilterList";
import { Button, TextField } from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import {
  useNavigate,
  createSearchParams,
  useParams,
  Link
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaPlus } from "react-icons/fa6";
import productApi from "../../../../apis/product";
import { formatCurrency } from "../../../../common";
import useQuertConfig from "../../../../hooks/useQuertConfig";
import Pagination from "./modules/Pagination";
import { BASE_URL_IMAGE } from "../../../../constants";
import ConfirmDelete from "../../../../components/Admin/ConfirmDelete";
import { toast } from "react-toastify";

function createData(id, name, calories, fat, carbs, protein) {
  return {
    id,
    name,
    calories,
    fat,
    carbs,
    protein
  };
}

const rows = [];

const headCells = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Tên sản phẩm"
  },
  {
    id: "photo",
    numeric: true,
    disablePadding: false,
    label: "Hình ảnh"
  },
  {
    id: "price",
    numeric: true,
    disablePadding: false,
    label: "Giá tiền",
  },
  {
    id: "category",
    numeric: true,
    disablePadding: false,
    label: "Danh mục"
  },
  {
    id: "brand",
    numeric: true,
    disablePadding: false,
    label: "Thương hiệu"
  },
  {
    id: "Hành động",
    numeric: true,
    disablePadding: false,
    label: "Hành động"
  }
];

function EnhancedTableHead() {
  return (
    <TableHead sx={{ backgroundColor: "#F4F6F8" }}>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align="center"
            padding={headCell.disablePadding ? "none" : "normal"}
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar() {
  const navigate = useNavigate();

  const queryConfig = useQuertConfig();
  const { register, handleSubmit, setValue } = useForm();
  const handleSearch = handleSubmit((data) => {
    navigate({
      pathname: "/admin/product",
      search: createSearchParams({
        ...queryConfig,
        name: data.name
      }).toString()
    });
  });

  return (
    <Toolbar
      sx={{
        py: 2,
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 }
      }}
    >
      <Box
        onSubmit={handleSearch}
        sx={{ flex: "1 1 100%" }}
        variant="h6"
        id="tableTitle"
        component="form"
      >
        <TextField
          {...register("name")}
          placeholder="Tìm kiếm sản phẩm"
          size="medium"
          sx={{ width: "450px" }}
        />
      </Box>

      <Tooltip title="Filter list">
        <IconButton>
          <FilterListIcon />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
}

export default function ManagerProduct() {
  const refId = React.useRef(null);
  const queryConfig = useQuertConfig();
  const { data: producstData, refetch } = useQuery({
    queryKey: ["products", queryConfig],
    queryFn: () => {
      return productApi.getAllProduct(queryConfig);
    },
    keepPreviousData: true
  });
  const products = producstData?.data.products;
  const pageSize = producstData?.data.pagination.page_size;

  const [open, setOpen] = React.useState(false);

  const handleDelete = (id) => {
    setOpen(true);
    refId.current = id;
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.deleteProduct(id),
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast.error('Không thể xóa vì sản phẩm đã được đặt hàng');
    }
  });

  const handleConfirm = () => {
    const idDelete = refId.current;
    deleteMutation.mutate(idDelete);
    refId.current = null;
    setOpen(false);
  };

  return (
    <React.Fragment>
      <ConfirmDelete open={open} setOpen={setOpen} onConfirm={handleConfirm} />
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            width: "100%",
            mb: 2,
            px: 4,
            py: 2,
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Typography color="gray" fontSize="24px" component="p">
            Quản lý sản phẩm
          </Typography>
          <Link to="/admin/product/deleted">
            <Button variant="outlined" color="error">
              Sản phẩm đã xóa
            </Button>
          </Link>
          <Link to="/admin/product/create">
            <Button sx={{ height: "55px" }} variant="outlined" color="success" >
              <FaPlus
                style={{ marginBottom: "4px", marginRight: "5px" }}
                fontSize="18px"
              />
              Thêm sản phẩm
            </Button>
          </Link>
        </Box>
        <Paper sx={{ width: "100%", mb: 2 }}>
          <EnhancedTableToolbar />
          <TableContainer>
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
              <EnhancedTableHead rowCount={rows.length} />
              <TableBody>
                {products &&
                  products.map((product, index) => {
                    const labelId = `enhanced-table-checkbox-${index}`;

                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={product.id}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell
                          sx={{ width: "16%" }}
                          component="th"
                          id={labelId}
                          scope="row"
                          padding="none"
                          align="center"
                        >
                          {product.name}
                        </TableCell>
                        <TableCell sx={{ width: "16%" }} align="center">
                          <img
                            width="70"
                            src={
                              product?.avatar
                                ? product.avatar.startsWith("http")
                                  ? product.avatar
                                  : BASE_URL_IMAGE + product.avatar
                                : "/default-image.png"
                            }
                            alt=""
                          />
                        </TableCell>
                        <TableCell sx={{ width: "16%" }} align="center">
                          {typeof product.price === 'number'
                            ? `${formatCurrency(product.price)} VND`
                            : "Không rõ"}
                        </TableCell>

                        <TableCell sx={{ width: "16%" }} align="center">
                          {product?.category?.name || "Không rõ"}
                        </TableCell>
                        <TableCell sx={{ width: "16%" }} align="center">
                          {product?.brand?.name || "Không rõ"}
                        </TableCell>
                        <TableCell sx={{ width: "16%" }} align="center">
                          <Button
                            onClick={() => handleDelete(product.id)}
                            variant="outlined"
                            color="error"
                          >
                            Xóa
                          </Button>
                          <Link to={`/admin/product/update/${product.id}`}>
                            <Button
                              sx={{ ml: 1 }}
                              variant="outlined"
                              color="primary"
                            >
                              Sửa
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "end", py: 3 }}>
            <Pagination pageSize={pageSize} queryConfig={queryConfig} />
          </Box>
        </Paper>
      </Box>
    </React.Fragment>
  );
}
