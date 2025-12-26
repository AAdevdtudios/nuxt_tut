export interface AuthResponse {
  jwt: string
  user: User
}

export interface User {
  id: number
  username: string
  email: string
  confirmed: boolean
  blocked: boolean
  role?: {
    id: number
    name: string
    type: string
  }
}
export interface ApiError {
  status: number
  name: string
  message: string
  details?: {
    errors: Array<{ id: string; message: string; field: string }>
  }
}