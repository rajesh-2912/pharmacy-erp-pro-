import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { getOcrDataFromImage } from '../services/geminiService';
import type { Medicine } from '../types';
import { Plus, Edit, Trash2, Search, X, FileUp, Upload, FileText, Camera, Loader2, AlertCircle } from 'lucide-react';

declare const XLSX: any; // Declare XLSX as a global variable to fix import error

const MedicineModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    medicine: Omit<Medicine, 'id'> | Medicine | null;
    onSave: (medicine: Omit<Medicine, 'id'> | Medicine) => Promise<void>;
}> = ({ isOpen, onClose, medicine, onSave }) => {
    const [formData, setFormData] = useState(medicine || { name: '', manufacturer: '', stock: 0, mrp: 0, expiryDate: '', category: '', batchNumber: '', hsnCode: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(medicine || { name: '', manufacturer: '', stock: 0, mrp: 0, expiryDate: '', category: '', batchNumber: '', hsnCode: '' });
    }, [medicine]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (window.confirm('Are you sure you want to save this medicine?')) {
            setIsSaving(true);
            await onSave(formData);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{'id' in formData ? 'Edit Medicine' : 'Add Medicine'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} placeholder="Manufacturer" required className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category (e.g., Painkiller)" required className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" required className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                        <input type="number" step="0.01" name="mrp" value={formData.mrp} onChange={handleChange} placeholder="MRP (₹)" required className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} placeholder="Batch Number" required className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                        <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="HSN Code" required className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    </div>
                    <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} placeholder="Expiry Date" required className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500" disabled={isSaving}>Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-primary-500 text-white hover:bg-primary-600 flex items-center" disabled={isSaving}>
                          {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
                          Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (medicines: Omit<Medicine, 'id'>[]) => Promise<void>;
}> = ({ isOpen, onClose, onImport }) => {
    const [importType, setImportType] = useState<'csv' | 'ocr'>('csv');
    const [parsedData, setParsedData] = useState<Omit<Medicine, 'id'>[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!isOpen) return null;
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setParsedData([]);
      setIsLoading(true);

      try {
        if (importType === 'ocr') {
            const result = await getOcrDataFromImage(file);
            if (result.error) setError(result.error);
            else setParsedData(result);
        } else {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet, {raw: false});

            const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
            
            const headerMap: { [key: string]: string } = {};
            const requiredHeaders = ['name', 'manufacturer', 'stock', 'mrp', 'expiryDate', 'category', 'batchNumber', 'hsnCode'];
            
            headers.forEach(h => {
                const header = String(h).toLowerCase().replace(/[^a-z0-9]/gi, '');
                if (header.includes('name')) headerMap.name = h;
                if (header.includes('manufacturer')) headerMap.manufacturer = h;
                if (header.includes('stock') || header.includes('quantity')) headerMap.stock = h;
                if (header.includes('mrp') || header.includes('price')) headerMap.mrp = h;
                if (header.includes('expiry')) headerMap.expiryDate = h;
                if (header.includes('category')) headerMap.category = h;
                if (header.includes('batch')) headerMap.batchNumber = h;
                if (header.includes('hsn')) headerMap.hsnCode = h;
            });
            
            const missingHeaders = requiredHeaders.filter(h => !Object.keys(headerMap).includes(h));
            if (missingHeaders.length > 0) {
                 throw new Error(`File is missing required columns: ${missingHeaders.join(', ')}`);
            }
            
            const formattedData = json.map(row => ({
                name: String(row[headerMap.name] || ''),
                manufacturer: String(row[headerMap.manufacturer] || 'Unknown'),
                stock: parseInt(String(row[headerMap.stock] || 0)),
                mrp: parseFloat(String(row[headerMap.mrp] || 0)),
                expiryDate: String(row[headerMap.expiryDate] || '').split(' ')[0], // Handle date-time formats
                category: String(row[headerMap.category] || 'General'),
                batchNumber: String(row[headerMap.batchNumber] || 'N/A'),
                hsnCode: String(row[headerMap.hsnCode] || 'N/A'),
            })).filter(m => m.name && !isNaN(m.stock) && !isNaN(m.mrp));
            
            setParsedData(formattedData);
        }
      } catch (err) {
        setError(`Failed to process file. ${err.message}. Please check file format and headers.`);
      }
      setIsLoading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    };
    
    const handleConfirmImport = async () => {
        if (window.confirm(`Are you sure you want to import ${parsedData.length} medicines?`)) {
            setIsLoading(true);
            await onImport(parsedData);
            setIsLoading(false);
            onClose();
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-4xl m-4 h-5/6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Import Stock</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X/></button>
                </div>
                {/* ... The rest of the modal is the same */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                    <button onClick={() => setImportType('csv')} className={`px-4 py-2 text-sm font-medium ${importType === 'csv' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-slate-500'}`}><FileText className="inline mr-2" size={16}/>Import from File</button>
                    <button onClick={() => setImportType('ocr')} className={`px-4 py-2 text-sm font-medium ${importType === 'ocr' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-slate-500'}`}><Camera className="inline mr-2" size={16}/>Scan from Image (OCR)</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col">
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                        <Upload className="mx-auto text-slate-400" size={40}/>
                        <p className="mt-2 text-slate-500">{importType === 'csv' ? 'Click to upload a .CSV or .XLSX file' : 'Click to upload an image of your stock list'}</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={importType === 'csv' ? '.csv,.xlsx' : 'image/*'} className="hidden"/>
                        <p className="text-xs text-slate-400 mt-2">Required columns for file import: name, manufacturer, stock, mrp, expiryDate, category, batchNumber, hsnCode</p>
                    </div>
                    {isLoading && <div className="flex justify-center items-center p-4"><Loader2 className="animate-spin text-primary-500" size={32} /> <span className="ml-2">Processing...</span></div>}
                    {error && <div className="text-red-500 text-center mt-4 p-2 bg-red-100 rounded flex items-center justify-center"><AlertCircle className="mr-2" size={16}/>{error}</div>}
                    
                    {parsedData.length > 0 && (
                        <div className="mt-4 flex-grow overflow-y-auto">
                            <h3 className="font-semibold mb-2">Preview Data ({parsedData.length} items)</h3>
                            <div className="bg-white dark:bg-slate-800 rounded-md overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-2">Name</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Stock</th><th className="px-4 py-2">MRP</th><th className="px-4 py-2">Batch #</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.map((med, i) => (
                                            <tr key={i} className="border-b dark:border-slate-700">
                                                <td className="px-4 py-2">{med.name}</td><td className="px-4 py-2">{med.category}</td><td className="px-4 py-2">{med.stock}</td><td className="px-4 py-2">₹{typeof med.mrp === 'number' ? med.mrp.toFixed(2) : '0.00'}</td><td className="px-4 py-2">{med.batchNumber}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500">Cancel</button>
                    <button onClick={handleConfirmImport} disabled={parsedData.length === 0 || isLoading} className="px-4 py-2 rounded bg-primary-500 text-white hover:bg-primary-600 disabled:bg-slate-400 flex items-center">
                        {isLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                        Confirm Import
                    </button>
                </div>
            </div>
        </div>
    );
};


const Inventory: React.FC = () => {
    const { medicines, addMedicine, updateMedicine, deleteMedicine, addMultipleMedicines, deleteMultipleMedicines } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
    const [selectedMeds, setSelectedMeds] = useState<Set<string>>(new Set());
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const categories = useMemo(() => ['all', ...Array.from(new Set(medicines.map(m => m.category)))], [medicines]);

    const filteredMedicines = useMemo(() => 
        medicines.filter(m => 
            (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterCategory === 'all' || m.category === filterCategory)
        ), [medicines, searchTerm, filterCategory]
    );

    const handleSave = async (medicine: Omit<Medicine, 'id'> | Medicine) => {
        if ('id' in medicine) {
            await updateMedicine(medicine);
        } else {
            await addMedicine(medicine);
        }
        setIsModalOpen(false);
        setEditingMedicine(null);
    };

    const handleSelect = (id: string) => {
        const newSelection = new Set(selectedMeds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedMeds(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedMeds(new Set(filteredMedicines.map(m => m.id)));
        } else {
            setSelectedMeds(new Set());
        }
    };

    const handleDeleteSelected = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedMeds.size} selected medicines? This action cannot be undone.`)) {
            await deleteMultipleMedicines(Array.from(selectedMeds));
            setSelectedMeds(new Set());
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this medicine?')) {
            await deleteMedicine(id);
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Inventory</h1>
                <div className="flex items-center gap-2">
                    {selectedMeds.size > 0 ? (
                        <button onClick={handleDeleteSelected} className="flex items-center px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow">
                           <Trash2 className="w-5 h-5 mr-2" /> Delete Selected ({selectedMeds.size})
                        </button>
                    ) : (
                        <>
                        <button onClick={() => setIsImportModalOpen(true)} className="flex items-center px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 shadow">
                            <FileUp className="w-5 h-5 mr-2" /> Import Stock
                        </button>
                        <button onClick={() => { setEditingMedicine(null); setIsModalOpen(true); }} className="flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 shadow">
                            <Plus className="w-5 h-5 mr-2" /> Add Medicine
                        </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search medicines..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700">
                    {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                </select>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="p-4">
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedMeds.size > 0 && selectedMeds.size === filteredMedicines.length} className="rounded" />
                                </th>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Batch #</th>
                                <th scope="col" className="px-6 py-3">Stock</th>
                                <th scope="col" className="px-6 py-3">MRP</th>
                                <th scope="col" className="px-6 py-3">Expiry Date</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMedicines.map(med => (
                                <tr key={med.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                     <td className="p-4">
                                        <input type="checkbox" checked={selectedMeds.has(med.id)} onChange={() => handleSelect(med.id)} className="rounded"/>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{med.name}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">{med.category}</span></td>
                                    <td className="px-6 py-4">{med.batchNumber}</td>
                                    <td className={`px-6 py-4 font-bold ${med.stock < 10 ? 'text-red-500' : ''}`}>{med.stock}</td>
                                    <td className="px-6 py-4">₹{med.mrp.toFixed(2)}</td>
                                    <td className="px-6 py-4">{med.expiryDate}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => { setEditingMedicine(med); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700"><Edit size={18}/></button>
                                        <button onClick={() => handleDelete(med.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <MedicineModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingMedicine(null); }}
                medicine={editingMedicine}
                onSave={handleSave}
            />
            <ImportModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={addMultipleMedicines}
            />
        </div>
    );
};

export default Inventory;