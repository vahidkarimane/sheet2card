export {}

// Create a type for the roles
export type Roles = 'admin' | 'distributor' 

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}