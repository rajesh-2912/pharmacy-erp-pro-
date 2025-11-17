import React, { useState, useMemo, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import type { CartItem, Sale, Medicine } from '../types';
import { Search, X, PlusCircle, MinusCircle, Trash2, Printer, Share2, Loader2 } from 'lucide-react';

const ReceiptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
}> = ({ isOpen, onClose, sale }) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !sale) return null;

    const handlePrint = () => {
        const printContent = receiptRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`<html><head><title>Print Receipt</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white">${printContent}</body></html>`);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    const handleShare = async () => {
        let shareText = `*Pharmacy ERP Pro Receipt*\n\n`;
        shareText += `Customer: ${sale.customer.name}\n`;
        shareText += `Date: ${new Date(sale.date).toLocaleString()}\n`;
        shareText += `--------------------------------\n`;
        shareText += `Item (Qty) - MRP -> Total\n`;
        sale.items.forEach(item => {
            shareText += `${item.name} (x${item.quantity}) - ₹${item.mrp.toFixed(2)} -> ₹${(item.mrp * item.quantity).toFixed(2)}\n`;
        });
        shareText += `--------------------------------\n`;
        shareText += `Subtotal: ₹${sale.subtotal.toFixed(2)}\n`;
        if (sale.discountAmount > 0) {
          shareText += `Discount (${sale.discountPercentage}%): -₹${sale.discountAmount.toFixed(2)}\n`;
        }
        shareText += `Tax: ₹${sale.tax.toFixed(2)}\n`;
        shareText += `*Total: ₹${sale.total.toFixed(2)}*\n`;
        shareText += `*You Saved: ₹${sale.totalSavings.toFixed(2)}*`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Pharmacy Receipt', text: shareText });
            } catch (error) { console.error('Error sharing:', error); }
        } else {
             try {
                await navigator.clipboard.writeText(shareText);
                alert('Receipt copied to clipboard!');
            } catch (err) { console.error('Failed to copy: ', err); }
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div ref={receiptRef} className="text-slate-800 dark:text-slate-200 p-4 font-mono">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold">Pharmacy ERP Pro</h2>
                        <p className="text-xs">Sale Receipt</p>
                    </div>
                    <div className="text-xs space-y-1 mb-4">
                        <p><strong>Customer:</strong> {sale.customer.name}</p>
                        <p><strong>Phone:</strong> {sale.customer.phone}</p>
                        <p><strong>Date:</strong> {new Date(sale.date).toLocaleString()}</p>
                        <p><strong>Receipt ID:</strong> {sale.id}</p>
                    </div>
                    <div className="border-t border-b border-dashed border-slate-400 py-2 my-2 text-xs">
                         <div className="flex font-bold"><span className="w-1/2">Item</span><span className="w-1/4 text-right">QtyxMRP</span><span className="w-1/4 text-right">Total</span></div>
                        {sale.items.map((item, index) => (
                                <div key={index} className="flex">
                                    <div className="w-full">
                                        <span>{item.name}</span>
                                        <div className="text-slate-500">
                                            <span>Batch: {item.batchNumber}</span>, <span>HSN: {item.hsnCode}</span>
                                        </div>
                                    </div>
                                    <div className="w-1/4 text-right">{item.quantity}x{item.mrp.toFixed(2)}</div>
                                    <div className="w-1/4 text-right">₹{(item.mrp * item.quantity).toFixed(2)}</div>
                                </div>
                            ))}
                    </div>
                     <div className="text-sm space-y-1 mt-4">
                        <div className="flex justify-between"><span>Subtotal</span><span>₹{sale.subtotal.toFixed(2)}</span></div>
                        {sale.discountAmount > 0 && (
                            <div className="flex justify-between"><span>Discount ({sale.discountPercentage}%)</span><span>- ₹{sale.discountAmount.toFixed(2)}</span></div>
                        )}
                        <div className="flex justify-between"><span>Tax (5%)</span><span>₹{sale.tax.toFixed(2)}</span></div>
                    </div>
                     <div className="flex justify-between font-bold text-lg mt-2 border-t border-slate-400 pt-2">
                        <span>Total Payable</span>
                        <span>₹{sale.total.toFixed(2)}</span>
                    </div>
                    {sale.totalSavings > 0 && (
                         <div className="text-center font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900 p-2 mt-4 rounded-lg">
                           You Saved ₹{sale.totalSavings.toFixed(2)}!
                         </div>
                    )}
                </div>
                <div className="flex justify-around mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={handlePrint} className="flex items-center gap-2 text-primary-500 hover:text-primary-700"><Printer size={20}/>Print</button>
                    <button onClick={handleShare} className="flex items-center gap-2 text-green-500 hover:text-green-700"><Share2 size={20}/>Share</button>
                    <button onClick={onClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-600 dark:text-white">Close</button>
                </div>
            </div>
        </div>
    );
};

const Sales: React.FC = () => {
    const { medicines, processSale } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return medicines.filter(m => 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) && m.stock > 0
        ).slice(0, 5);
    }, [medicines, searchTerm]);

    const addToCart = (medicineId: string) => {
        const existingItem = cart.find(item => item.medicine.id === medicineId);
        const medicineToAdd = medicines.find(m => m.id === medicineId);
        if (!medicineToAdd) return;

        if (existingItem) {
            if (existingItem.quantity < medicineToAdd.stock) {
                setCart(cart.map(item => item.medicine.id === medicineId ? { ...item, quantity: item.quantity + 1 } : item));
            }
        } else {
            setCart([...cart, { medicine: medicineToAdd, quantity: 1 }]);
        }
        setSearchTerm('');
    };
    
    // updateQuantity and removeFromCart remain the same

    const updateQuantity = (medicineId: string, newQuantity: number) => {
        const medicineInStock = medicines.find(m => m.id === medicineId);
        if (!medicineInStock) return;
        
        if (newQuantity > 0 && newQuantity <= medicineInStock.stock) {
             setCart(cart.map(item => item.medicine.id === medicineId ? { ...item, quantity: newQuantity } : item));
        } else if (newQuantity === 0) {
            removeFromCart(medicineId);
        }
    };

    const removeFromCart = (medicineId: string) => {
        setCart(cart.filter(item => item.medicine.id !== medicineId));
    };

    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.medicine.mrp * item.quantity, 0), [cart]);
    const discountAmount = useMemo(() => subtotal * (discountPercentage / 100), [subtotal, discountPercentage]);
    const subtotalAfterDiscount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
    const tax = useMemo(() => subtotalAfterDiscount * 0.05, [subtotalAfterDiscount]); // 5% Tax
    const total = useMemo(() => subtotalAfterDiscount + tax, [subtotalAfterDiscount, tax]);
    
    const isCheckoutDisabled = cart.length === 0 || !customerName.trim() || customerPhone.trim().length !== 10;

    const handleCheckout = async () => {
        if (!isCheckoutDisabled) {
            if (!window.confirm(`Process sale for ${customerName} with a total of ₹${total.toFixed(2)}?`)) return;

            setIsProcessing(true);
            try {
                const sale = await processSale(cart, { name: customerName, phone: customerPhone }, discountPercentage);
                setLastSale(sale);
                setIsReceiptOpen(true);
                setCart([]);
                setCustomerName('');
                setCustomerPhone('');
                setDiscountPercentage(0);
            } catch (error) {
                console.error("Failed to process sale:", error);
                alert(`Error: ${error.message}`);
            } finally {
                setIsProcessing(false);
            }
        }
    }

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6">
            {/* Left Side - POS */}
            <div className="lg:w-3/5 flex flex-col">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Point of Sale</h1>
                 <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search for medicines to sell..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                    />
                     {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg z-10">
                            {searchResults.map(med => (
                                <div key={med.id} onClick={() => addToCart(med.id)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex justify-between">
                                    <div>
                                        <p>{med.name}</p>
                                        <p className="text-xs text-slate-400">{med.category}</p>
                                    </div>
                                    <span className="text-slate-500">₹{med.mrp.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex-grow bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 overflow-y-auto">
                    {cart.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500">Your cart is empty</div>
                    ) : (
                       <div className="space-y-3">
                        {cart.map(item => (
                            <div key={item.medicine.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 dark:text-white">{item.medicine.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">MRP: ₹{item.medicine.mrp.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.medicine.id, item.quantity - 1)}><MinusCircle className="text-slate-400 hover:text-red-500" size={20}/></button>
                                    <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.medicine.id, parseInt(e.target.value) || 0)} className="w-12 text-center rounded bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500"/>
                                    <button onClick={() => updateQuantity(item.medicine.id, item.quantity + 1)}><PlusCircle className="text-slate-400 hover:text-green-500" size={20}/></button>
                                </div>
                                <p className="w-20 text-right font-semibold">₹{(item.medicine.mrp * item.quantity).toFixed(2)}</p>
                                <button onClick={() => removeFromCart(item.medicine.id)} className="ml-4 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                            </div>
                        ))}
                       </div>
                    )}
                </div>
            </div>

            {/* Right Side - Summary */}
            <div className="lg:w-2/5 bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 flex flex-col">
                <h2 className="text-2xl font-bold border-b pb-4 mb-4 border-slate-200 dark:border-slate-700">Order Summary</h2>
                <div className="flex-grow space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Customer Name</label>
                        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter full name" required className="w-full mt-1 p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Customer Phone</label>
                        <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter 10-digit phone number" required maxLength={10} className="w-full mt-1 p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Discount (%)</label>
                         <input type="number" value={discountPercentage} onChange={(e) => setDiscountPercentage(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} placeholder="e.g. 10" className="w-full mt-1 p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    </div>

                    <div className="space-y-2 text-lg pt-4">
                      <div className="flex justify-between"><span>Subtotal (MRP)</span><span>₹{subtotal.toFixed(2)}</span></div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-red-500">
                            <span>Discount ({discountPercentage}%)</span>
                            <span>- ₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between"><span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-xl pt-4 border-t border-slate-200 dark:border-slate-700">
                          <span>Total</span><span>₹{total.toFixed(2)}</span>
                      </div>
                       {discountAmount > 0 && (
                         <div className="text-center font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900 p-2 mt-2 rounded-lg">
                           Total Savings: ₹{discountAmount.toFixed(2)}
                         </div>
                      )}
                    </div>
                </div>
                <button 
                  onClick={handleCheckout} 
                  disabled={isCheckoutDisabled || isProcessing}
                  className="w-full py-3 mt-4 text-lg font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600 flex items-center justify-center"
                >
                    {isProcessing && <Loader2 className="animate-spin mr-2" />}
                    Process Sale
                </button>
            </div>
            <ReceiptModal 
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                sale={lastSale}
            />
        </div>
    );
};

export default Sales;