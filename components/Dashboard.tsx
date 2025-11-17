
import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Pill, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { medicines, sales } = useInventory();

    const totalMedicines = medicines.length;
    const lowStockMedicines = medicines.filter(m => m.stock < 10).length;
    const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);

    const salesData = sales.reduce((acc, sale) => {
        const month = new Date(sale.date).toLocaleString('default', { month: 'short' });
        const existing = acc.find(d => d.name === month);
        if (existing) {
            existing.sales += sale.total;
        } else {
            acc.push({ name: month, sales: sale.total });
        }
        return acc;
    }, [] as { name: string; sales: number }[]).reverse();


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Medicines" value={totalMedicines} icon={Pill} color="bg-blue-500" />
                <StatCard title="Low Stock" value={lowStockMedicines} icon={AlertTriangle} color="bg-yellow-500" />
                <StatCard title="Total Revenue" value={`₹${totalSales.toFixed(2)}`} icon={DollarSign} color="bg-green-500" />
                <StatCard title="Sales (This Month)" value={sales.filter(s=> new Date(s.date).getMonth() === new Date().getMonth()).length} icon={TrendingUp} color="bg-indigo-500" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md h-96">
                <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Monthly Sales</h2>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `₹${value}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', color: '#fff' }}
                          formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Sales']}
                        />
                        <Legend />
                        <Bar dataKey="sales" fill="#3b82f6" name="Sales (₹)"/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Dashboard;
