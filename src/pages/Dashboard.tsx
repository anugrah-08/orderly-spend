import {
  Building2, ClipboardList, CheckSquare, DollarSign,
  TrendingUp, TrendingDown, ArrowUpRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";

const kpis = [
  { title: "Total Vendors", value: "248", change: "+12%", trend: "up", icon: Building2, color: "text-primary" },
  { title: "Active POs", value: "42", change: "+8%", trend: "up", icon: ClipboardList, color: "text-primary" },
  { title: "Pending Approvals", value: "15", change: "-3%", trend: "down", icon: CheckSquare, color: "text-warning" },
  { title: "Monthly Spending", value: "$284K", change: "+5.2%", trend: "up", icon: DollarSign, color: "text-success" },
];

const spendingData = [
  { month: "Jan", amount: 210000 }, { month: "Feb", amount: 195000 },
  { month: "Mar", amount: 240000 }, { month: "Apr", amount: 220000 },
  { month: "May", amount: 260000 }, { month: "Jun", amount: 284000 },
  { month: "Jul", amount: 275000 }, { month: "Aug", amount: 290000 },
];

const vendorDistribution = [
  { name: "IT Services", value: 35, color: "hsl(217, 91%, 50%)" },
  { name: "Office Supplies", value: 25, color: "hsl(152, 60%, 42%)" },
  { name: "Marketing", value: 20, color: "hsl(38, 92%, 50%)" },
  { name: "Logistics", value: 12, color: "hsl(280, 60%, 50%)" },
  { name: "Other", value: 8, color: "hsl(215, 20%, 70%)" },
];

const recentOrders = [
  { id: "PO-2024-001", vendor: "TechCorp Solutions", amount: "$12,450", status: "Active", date: "Mar 6, 2026" },
  { id: "PO-2024-002", vendor: "Office Depot", amount: "$3,280", status: "Pending", date: "Mar 5, 2026" },
  { id: "PO-2024-003", vendor: "CloudNet Services", amount: "$28,900", status: "Active", date: "Mar 4, 2026" },
  { id: "PO-2024-004", vendor: "PrintMedia Inc", amount: "$1,750", status: "Completed", date: "Mar 3, 2026" },
  { id: "PO-2024-005", vendor: "DataFlow Analytics", amount: "$8,600", status: "Active", date: "Mar 2, 2026" },
];

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Procurement overview and analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="kpi-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <span className={`text-xs font-medium flex items-center gap-1 ${kpi.trend === "up" ? "text-success" : "text-destructive"}`}>
                {kpi.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{kpi.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spending Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Procurement Spending</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={spendingData}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" tickFormatter={(v) => `$${v / 1000}K`} />
              <Tooltip formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, "Spending"]} />
              <Area type="monotone" dataKey="amount" stroke="hsl(217, 91%, 50%)" strokeWidth={2} fill="url(#spendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vendor Distribution */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Vendor Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={vendorDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {vendorDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {vendorDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="table-container">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold">Recent Purchase Orders</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">PO Number</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-primary">{order.id}</td>
                <td className="px-6 py-3 text-sm">{order.vendor}</td>
                <td className="px-6 py-3 text-sm font-medium">{order.amount}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
