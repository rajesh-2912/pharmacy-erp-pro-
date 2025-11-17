export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  stock: number;
  price: number;
  expiryDate: string; // YYYY-MM-DD
}

export interface Sale {
  id: string;
  items: {
    medicineId: string;
    quantity: number;
    price: number; // Price at time of sale
  }[];
  customer: {
    name: string;
    phone: string;
  };
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
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