import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  Utensils
} from 'lucide-react';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Хоол'); // Default category
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Хоол', 'Шөл', 'Хөнгөн зууш', 'Коктейль', 'Ундаа', 'Шар айраг', 'Бусад'];

  const fetchMenu = async () => {
    try {
      const res = await api.getMenuItems();
      setMenuItems(res.data);
    } catch (err) {
      console.error('Menu items fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setCategory('Хоол');
    setDescription('');
    setPrice('');
    setImage('');
    setIsAvailable(true);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
    setPrice(item.price.toString());
    setImage(item.image || '');
    setIsAvailable(item.isAvailable);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Энэ хоол/ундааг цэснээс устгах уу?')) return;
    try {
      await api.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.message || 'Устгахад алдаа гарлаа.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !category) {
      alert('Нэр, үнэ болон ангиллыг оруулна уу.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      category,
      description,
      price: parseFloat(price),
      image: image || null,
      isAvailable,
    };

    try {
      if (editingId) {
        const res = await api.updateMenuItem(editingId, payload);
        setMenuItems(prev => prev.map(item => item.id === editingId ? res.data : item));
      } else {
        const res = await api.createMenuItem(payload);
        setMenuItems(prev => [...prev, res.data]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group menu items by category
  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Цэсний удирдлага</h1>
          <p className="text-slate-400 text-sm">Хоол, ундааны нэрс, ангилал болон үнэ удирдах</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Цэсэнд нэмэх
        </button>
      </div>

      {/* Grid of Grouped Menu Items */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-500 text-sm">Хоолны цэсийг ачаалж байна...</p>
        </div>
      ) : menuItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-900 flex flex-col items-center justify-center gap-3">
          <Utensils className="w-10 h-10 text-slate-600" />
          <h3 className="text-slate-300 font-bold">Цэс хоосон байна</h3>
          <p className="text-slate-500 text-sm">Цэсэнд шинэ хоол, ундааны төрөл нэмнэ үү.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.keys(groupedMenu).map((cat) => (
            <div key={cat} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groupedMenu[cat].map((item) => (
                  <div 
                    key={item.id} 
                    className={`rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden transition-all hover:border-slate-700 relative group ${
                      !item.isAvailable ? 'opacity-65' : ''
                    }`}
                  >
                    {/* Item Image */}
                    <div className="h-44 bg-slate-950 relative flex items-center justify-center text-slate-700">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = ''; // Clear image to show placeholder
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 opacity-40" />
                      )}
                      
                      {/* Availability Overlay */}
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                          <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded-full border border-red-500/20">
                            Дууссан (Sold Out)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-slate-100 text-base line-clamp-1">{item.name}</h3>
                          <span className="text-amber-500 font-extrabold text-sm shrink-0">
                            {parseFloat(item.price).toLocaleString()} ₮
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs line-clamp-2 min-h-[32px]">
                          {item.description || 'Тайлбар оруулаагүй байна.'}
                        </p>
                      </div>

                      {/* Action hover buttons */}
                      <div className="flex gap-2 border-t border-slate-800/40 mt-4 pt-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="flex-1 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs flex justify-center items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Засах
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-2.5 py-1.5 bg-slate-850 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/10 rounded-lg text-xs transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Цэсний мэдээлэл засах' : 'Цэсэнд шинэ зүйл нэмэх'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Нэр</label>
                <input
                  type="text"
                  placeholder="Жишээ: Бууз, Цуйван, Мохито"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Ангилал</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Үнэ (₮)</label>
                <input
                  type="number"
                  placeholder="15000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Зургийн URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Тайлбар</label>
                <textarea
                  rows="3"
                  placeholder="Бүтээгдэхүүний орц найрлага, тайлбар..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4.5 h-4.5 accent-amber-500 rounded border-slate-700 bg-slate-850"
                  disabled={submitting}
                />
                <label htmlFor="isAvailable" className="text-slate-300 text-sm font-semibold select-none cursor-pointer">
                  Захиалах боломжтой
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm flex justify-center items-center gap-2"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Хадгалах'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
