import axios, { HttpStatusCode } from 'axios'
import { cleanAccessToken, clearLS, cleanProfile, getAccessToken, saveAccessToken, setProfile } from '../common/auth'
import { toast } from 'react-toastify'

class AxiosClient {
    instance
    accessToken

    constructor() {
        this.accessToken = getAccessToken()
        this.instance = axios.create({
            baseURL: 'http://localhost:8000/api/v1/',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        this.instance.interceptors.request.use(
            (config) => {
                if (this.accessToken) {
                    config.headers.authorization = `Bearer ${this.accessToken}`
                    return config
                }
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        this.instance.interceptors.response.use(
            (response) => {
              console.log('...')
              const { url } = response.config
          
              if (url === '/auth/login' || url === '/auth/google-login') {
                const { token, user } = response.data.data
                this.accessToken = token
                this.tempToken = token
                saveAccessToken(this.accessToken)
                setProfile(user)
              } else if (url === '/users/logout') {
                console.log('logout')
                this.accessToken = ''
                cleanAccessToken()
                cleanProfile()
              }
          
              // ✅ Thông báo thành công nếu có message
              if (response.data.success === true && response.data.data?.message) {
                toast.success(response.data.data.message)
              }
          
              return response.data
            },
            (error) => {
              if (error.response?.status == HttpStatusCode.Unauthorized) {
                clearLS()
              }
              console.log(error.response?.status)
              return Promise.reject(error)
            }
          )
          
    }
}

const axiosClient = new AxiosClient().instance
export default axiosClient
