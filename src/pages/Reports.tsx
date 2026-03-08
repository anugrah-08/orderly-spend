import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";

const monthlySpend = [
  { month: "Sep", amount: 180000 }, { month: "Oct", amount: 210000 },
  { month: "Nov", amount: 195000 }, { month: "Dec", amount: 240000 },
  { month: "Jan", amount: 220000 }, { month: "Feb", amount: 260000 },
  { month: "Mar", amount: 284000 },
];

const vendorComparison = [
  { name: "TechCorp", cost: 45000 },
  { name: "CloudNet", cost: 38000 },
  { name: "DataFlow", cost: 28000 },
  { name: "SecureGuard", cost: 22000 },
  { name: "Office Depot", cost: 15000 },
];

const deptSpending = [
  { name: "Engineering", value: 42, color: "hsl(217, 91%, 50%)" },
  { name: "IT", value: 24, color: "hsl(152, 60%, 42%)" },
  { name: "Operations", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "HR", value: 10, color: "hsl(280, 60%, 50%)" },
  { name: "Admin", value: 6, color: "hsl(215, 20%, 70%)" },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Procurement analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Spend Trend */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Monthly Spend Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlySpend}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" tickFormatter={(v) => `$${v / 1000}K`} />
              <Tooltip formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, "Spending"]} />
              <Area type="monotone" dataKey="amount" stroke="hsl(217, 91%, 50%)" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vendor Cost Comparison */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Vendor Cost Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={vendorComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" tickFormatter={(v) => `$${v / 1000}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" width={80} />
              <Tooltip formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, "Cost"]} />
              <Bar dataKey="cost" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Spending */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Department Spending Distribution</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="40%" height={250}>
              <PieChart>
                <Pie data={deptSpending} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {deptSpending.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-4">
              {deptSpending.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="font-medium">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${dept.value}%`, backgroundColor: dept.color }} />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{dept.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
