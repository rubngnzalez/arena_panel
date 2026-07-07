"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Bell,
  Trash2,
  Check,
  MessageSquare,
  Clock,
  AlertCircle,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Notification {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  created_at: string
}

export default function NotificationsPage() {
  const supabase = useSupabase()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [supabase])

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from("notificaciones")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", id)

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    )
  }

  const deleteNotification = async (id: string) => {
    await supabase.from("notificaciones").delete().eq("id", id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.leida)
    for (const notif of unread) {
      await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", notif.id)
    }
    setNotifications(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, React.ReactNode> = {
      proyecto_actualizado: <Clock className="h-4 w-4" />,
      documento_compartido: <MessageSquare className="h-4 w-4" />,
      mensaje: <Bell className="h-4 w-4" />,
      alerta: <AlertCircle className="h-4 w-4" />,
    }
    return icons[tipo] || <Bell className="h-4 w-4" />
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal tracking-tight mb-2">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {notifications.filter(n => !n.leida).length} no leídas
          </p>
        </div>
        {notifications.some(n => !n.leida) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-xs text-muted-foreground">Cargando...</div>
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
        </Card>
      ) : (
        <div className="space-y-px border-t border-border">
          {notifications.map((notif, index) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 py-4 ${
                index < notifications.length - 1 ? 'border-b border-border' : ''
              } ${!notif.leida ? 'bg-primary/5' : ''}`}
            >
              <div className={`p-2 ${!notif.leida ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                {getTipoIcon(notif.tipo)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm">{notif.titulo}</h3>
                  {!notif.leida && (
                    <Badge variant="primary" className="text-xs">
                      Nueva
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{notif.mensaje}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(notif.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                {!notif.leida && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markAsRead(notif.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteNotification(notif.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
