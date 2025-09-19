import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, TrendingUp, Users } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    totalBookings: number
    thisMonthBookings: number
    upcomingBookings: number
    activeEventTypes: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Calendar,
      description: "All time bookings",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "This Month",
      value: stats.thisMonthBookings,
      icon: TrendingUp,
      description: "Bookings this month",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Upcoming",
      value: stats.upcomingBookings,
      icon: Clock,
      description: "Future bookings",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Event Types",
      value: stats.activeEventTypes,
      icon: Users,
      description: "Active event types",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
