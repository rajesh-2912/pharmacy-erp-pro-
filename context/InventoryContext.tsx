import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Medicine, Sale, CartItem } from '../types';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, runTransaction, writeBatch } from 'firebase/firestore';

const TAX_RATE = 0.05; // 5%

interface InventoryContextType {
  medicines: Medicine[];
  sales: Sale[];
  loading: boolean;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<void>;
  addMultipleMedicines: (medicines: Omit<Medicine, 'id'>[]) => Promise<void>;
  updateMedicine: (medicine: Medicine) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  deleteMultipleMedicines: (ids: string[]) => Promise<void>;
  processSale: (cart: CartItem[], customer: { name: string; phone: string; }, discountPercentage: number) => Promise<Sale>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubMedicines = onSnapshot(collection(db, 'medicines'), (snapshot) => {
      const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medicine));
      setMedicines(meds);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching medicines:", error);
        setLoading(false);
    });

    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setSales(salesData);
    }, (error) => {
        console.error("Error fetching sales:", error);
    });

    return () => {
      unsubMedicines();
      unsubSales();
    };
  }, []);

  const addMedicine = async (medicine: Omit<Medicine, 'id'>) => {
    await addDoc(collection(db, 'medicines'), medicine);
  };

  const addMultipleMedicines = async (newMedicines: Omit<Medicine, 'id'>[]) => {
    const batch = writeBatch(db);
    newMedicines.forEach((med) => {
        const docRef = doc(collection(db, 'medicines'));
        batch.set(docRef, med);
    });
    await batch.commit();
  };

  const updateMedicine = async (updatedMedicine: Medicine) => {
    const { id, ...medData } = updatedMedicine;
    await updateDoc(doc(db, 'medicines', id), medData);
  };

  const deleteMedicine = async (id: string) => {
    await deleteDoc(doc(db, 'medicines', id));
  };
  
  const deleteMultipleMedicines = async (ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, 'medicines', id));
    });
    await batch.commit();
  };


  const processSale = async (cart: CartItem[], customer: { name: string; phone: string; }, discountPercentage: number): Promise<Sale> => {
    const newSaleId = doc(collection(db, 'sales')).id;

    await runTransaction(db, async (transaction) => {
        // 1. Check stock and prepare updates
        const stockUpdates: { ref: any, newStock: number }[] = [];
        for (const item of cart) {
            const medRef = doc(db, 'medicines', item.medicine.id);
            const medDoc = await transaction.get(medRef);
            if (!medDoc.exists()) throw new Error(`Medicine ${item.medicine.name} not found!`);
            
            const currentStock = medDoc.data().stock;
            if (currentStock < item.quantity) {
                throw new Error(`Not enough stock for ${item.medicine.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
            }
            stockUpdates.push({ ref: medRef, newStock: currentStock - item.quantity });
        }
        
        // 2. Create Sale Object
        const subtotal = cart.reduce((acc, item) => acc + item.medicine.mrp * item.quantity, 0);
        const discountAmount = subtotal * (discountPercentage / 100);
        const totalSavings = discountAmount;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const tax = subtotalAfterDiscount * TAX_RATE;
        const total = subtotalAfterDiscount + tax;

        const newSale: Omit<Sale, 'id'> = {
          customer,
          items: cart.map(item => ({
            medicineId: item.medicine.id,
            name: item.medicine.name,
            quantity: item.quantity,
            mrp: item.medicine.mrp,
            price: item.medicine.mrp * (1 - (40/100)), // Assuming the 40% discount logic is still needed, though discountPercentage is passed for total bill discount
            batchNumber: item.medicine.batchNumber,
            hsnCode: item.medicine.hsnCode,
          })),
          subtotal,
          discountPercentage,
          discountAmount,
          totalSavings,
          tax,
          total,
          date: new Date().toISOString()
        };
        
        // 3. Commit stock updates
        stockUpdates.forEach(update => {
            transaction.update(update.ref, { stock: update.newStock });
        });
        
        // 4. Create sale document
        transaction.set(doc(db, 'sales', newSaleId), newSale);
    });

    // Return the full sale object (without Omit)
    const saleDoc = {id: newSaleId, ... (await doc(db, 'sales', newSaleId).get()).data()} as Sale; // Re-fetch to be sure
    return saleDoc;
  };

  return (
    <InventoryContext.Provider value={{ medicines, sales, loading, addMedicine, addMultipleMedicines, updateMedicine, deleteMedicine, deleteMultipleMedicines, processSale }}>
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