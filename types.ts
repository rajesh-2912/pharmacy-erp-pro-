export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  stock: number;
  mrp: number;
  expiryDate: string; // YYYY-MM-DD
  category: string;
  batchNumber: string;
  hsnCode: string;
}

export interface Sale {
  id: string;
  items: {
    medicineId: string;
    name: string;
    quantity: number;
    mrp: number; // MRP at time of sale
    price: number; // Price after discount at time of sale
    batchNumber: string;
    hsnCode: string;
  }[];
  customer: {
    name: string;
    phone: string;
  };
  subtotal: number; // Sum of (MRP * quantity)
  discountPercentage: number;
  discountAmount: number;
  totalSavings: number; // Same as discountAmount for clarity
  tax: number;
  total: number;
  date: string; // ISO string
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}