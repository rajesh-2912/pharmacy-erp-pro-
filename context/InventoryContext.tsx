import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Medicine, Sale, CartItem } from '../types';
import { nanoid } from 'nanoid';

// MOCK DATA - Used only if localStorage is empty
const initialMedicines: Medicine[] = [
  { id: 'med1', name: 'Paracetamol 500mg', manufacturer: 'Pharma Inc.', stock: 150, price: 25.50, expiryDate: '2025-12-31' },
  { id: 'med2', name: 'Ibuprofen 200mg', manufacturer: 'MediCorp', stock: 8, price: 45.00, expiryDate: '2024-11-30' },
  { id: 'med3', name: 'Aspirin 100mg', manufacturer: 'HealthWell', stock: 200, price: 15.75, expiryDate: '2026-01-15' },
  { id: 'med4', name: 'Amoxicillin 250mg', manufacturer: 'Pharma Inc.', stock: 75, price: 80.00, expiryDate: '2025-06-30' },
  { id: 'med5', name: 'Loratadine 10mg', manufacturer: 'AllergyFree', stock: 45, price: 99.50, expiryDate: '2025-08-22' },
];

const initialSales: Sale[] = [
    { id: 'sale1', customer: { name: 'Ravi Kumar', phone: '9876543210'}, items: [{ medicineId: 'med1', quantity: 2, price: 25.50 }, { medicineId: 'med3', quantity: 1, price: 15.75 }], subtotal: 66.75, discountPercentage: 10, discountAmount: 6.68, tax: 3.00, total: 63.07, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'sale2', customer: { name: 'Priya Sharma', phone: '9876543211'}, items: [{ medicineId: 'med2', quantity: 1, price: 45.00 }], subtotal: 45.00, discountPercentage: 0, discountAmount: 0, tax: 2.25, total: 47.25, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

const TAX_RATE = 0.05; // 5% GST

interface InventoryContextType {
  medicines: Medicine[];
  sales: Sale[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  addMultipleMedicines: (medicines: Omit<Medicine, 'id'>[]) => void;
  updateMedicine: (medicine: Medicine) => void;
  deleteMedicine: (id: string) => void;
  processSale: (cart: CartItem[], customer: { name: string; phone: string; }, discountPercentage: number) => Sale;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    try {
      const storedMedicines = window.localStorage.getItem('medicines');
      return storedMedicines ? JSON.parse(storedMedicines) : initialMedicines;
    } catch (error) {
      console.error("Failed to parse medicines from localStorage", error);
      return initialMedicines;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const storedSales = window.localStorage.getItem('sales');
      return storedSales ? JSON.parse(storedSales) : initialSales;
    } catch (error) {
      console.error("Failed to parse sales from localStorage", error);
      return initialSales;
    }
  });

  useEffect(() => {
    window.localStorage.setItem('medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    window.localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);


  const addMedicine = (medicine: Omit<Medicine, 'id'>) => {
    setMedicines(prev => [...prev, { ...medicine, id: nanoid() }]);
  };

  const addMultipleMedicines = (newMedicines: Omit<Medicine, 'id'>[]) => {
    const medicinesToAdd = newMedicines.map(med => ({ ...med, id: nanoid() }));
    setMedicines(prevMeds => [...prevMeds, ...medicinesToAdd]);
  };

  const updateMedicine = (updatedMedicine: Medicine) => {
    setMedicines(prev => prev.map(m => m.id === updatedMedicine.id ? updatedMedicine : m));
  };

  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const processSale = (cart: CartItem[], customer: { name: string; phone: string; }, discountPercentage: number) => {
    const subtotal = cart.reduce((acc, item) => acc + item.medicine.price * item.quantity, 0);
    const discountAmount = subtotal * (discountPercentage / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const tax = subtotalAfterDiscount * TAX_RATE;
    const total = subtotalAfterDiscount + tax;

    const newSale: Sale = {
      id: nanoid(),
      customer,
      items: cart.map(item => ({
        medicineId: item.medicine.id,
        quantity: item.quantity,
        price: item.medicine.price
      })),
      subtotal,
      discountPercentage,
      discountAmount,
      tax,
      total,
      date: new Date().toISOString()
    };
    setSales(prev => [...prev, newSale]);
    
    // Update stock
    const updatedMedicines = [...medicines];
    cart.forEach(item => {
        const medIndex = updatedMedicines.findIndex(m => m.id === item.medicine.id);
        if (medIndex !== -1) {
            updatedMedicines[medIndex].stock -= item.quantity;
        }
    });
    setMedicines(updatedMedicines);
    return newSale;
  };

  return (
    <InventoryContext.Provider value={{ medicines, sales, addMedicine, addMultipleMedicines, updateMedicine, deleteMedicine, processSale }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
