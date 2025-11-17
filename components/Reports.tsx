import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Download } from 'lucide-react';

const Reports: React.FC = () => {
    const { medicines, sales } = useInventory();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert("No data available for the selected range.");
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateStockReport = () => {
        const stockData = medicines.map(({ id, ...rest }) => rest);
        downloadCSV(stockData, 'stock_report.csv');
    };

    const generateSalesReport = () => {
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (start && saleDate < start) return false;
            if (end && saleDate > end) return false;
            return true;
        });

        const salesData = filteredSales.flatMap(sale => 
            sale.items.map(item => {
                const medicine = medicines.find(m => m.id === item.medicineId);
                return {
                    saleId: sale.id,
                    date: new Date(sale.date).toLocaleString(),
                    customerName: sale.customer.name,
                    customerPhone: sale.customer.phone,
                    medicineName: medicine?.name || 'N/A',
                    quantity: item.quantity,
                    pricePerUnit: item.price.toFixed(2),
                    lineItemTotal: (item.quantity * item.price).toFixed(2),
                    saleDiscountPercentage: sale.discountPercentage,
                    saleTotal: sale.total.toFixed(2),
                };
            })
        );

        downloadCSV(salesData, `sales_report_${startDate}_to_${endDate}.csv`);
    };

    const generateTaxReport = () => {
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (start && saleDate < start) return false;
            if (end && saleDate > end) return false;
            return true;
        });

        const taxData = filteredSales.map(sale => ({
            saleId: sale.id,
            date: new Date(sale.date).toLocaleString(),
            customerName: sale.customer.name,
            subtotal: sale.subtotal.toFixed(2),
            discountPercentage: sale.discountPercentage,
            discountAmount: sale.discountAmount.toFixed(2),
            taxableAmount: (sale.subtotal - sale.discountAmount).toFixed(2),
            tax: sale.tax.toFixed(2),
            total: sale.total.toFixed(2),
        }));

        downloadCSV(taxData, `tax_summary_${startDate}_to_${endDate}.csv`);
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reports</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stock Report */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Stock Report</h2>
                    <p className="text-sm text-slate-500 mb-4">Download a full list of all medicines currently in your inventory.</p>
                    <button onClick={generateStockReport} className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                        <Download className="w-5 h-5 mr-2" /> Download Stock List
                    </button>
                </div>
                
                {/* Sales & Tax Reports */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Sales & Tax Reports</h2>
                    <p className="text-sm text-slate-500 mb-4">Select a date range to generate detailed reports for sales or tax summaries.</p>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                        </div>
                        <div className="flex-1">
                             <label className="text-sm font-medium">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <button onClick={generateSalesReport} className="flex-1 flex items-center justify-center px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600">
                            <Download className="w-5 h-5 mr-2" /> Download Sales Report
                        </button>
                         <button onClick={generateTaxReport} className="flex-1 flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">
                            <Download className="w-5 h-5 mr-2" /> Download Tax Summary
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;