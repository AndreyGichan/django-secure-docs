"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getCurrentUser } from "@/lib/api/auth"

type UserRole = "admin" | "manager" | "employee"

interface UserContextType {
  role: UserRole | null
  name: string
  email: string
  initials: string
  loading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(" ").filter(Boolean)

    const first = parts[0]?.[0] || ""
    const second = parts[1]?.[0] || ""

    return (first + second).toUpperCase()
  }
  const initials = getInitials(name)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentUser()
        const user = res.data

        setRole(user.role)
        setName(user.full_name)
        setEmail(user.email)

      } catch (e) {
        console.error("Failed to load user", e)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])


  return (
    <UserContext.Provider value={{ role, name, email, initials, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUser must be used within UserProvider")
  return context
}
