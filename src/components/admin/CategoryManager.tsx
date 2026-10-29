import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CollectionCategory } from '../../types';
import { productBelongsToCollection } from '../../utils/productCategories';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Globe,
  Smartphone
} from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    image: string;
    description: string;
    color: string;
  }>({
    name: '',
    image: '',
    description: '',
    color: '#312E81'
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    setFormData({
      name: '',
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop',
      description: '',
      color: '#312E81'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: CollectionCategory) => {
    setEditingId(cat.id);
    setFormError(null);
    setFormData({
      name: cat.name,
      image: cat.image,
      description: cat.description || '',
      color: cat.color || '#312E81'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.image.trim()) return;

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await updateCategory(editingId, {
          name: formData.name.trim(),
          image: formData.image.trim(),
          description: formData.description.trim(),
          tagline: '',
          subcategories: [],
          color: formData.color
        });
      } else {
        await addCategory({
          name: formData.name.trim(),
          image: formData.image.trim(),
          description: formData.description.trim(),
          tagline: '',
          subcategories: [],
          color: formData.color,
          isFeaturedInApp: true
        });
      }
      setModalOpen(false);
      setEditingId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The collection could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const linkedProducts = products.filter(product => productBelongsToCollection(product, id));
    if (linkedProducts.length > 0) {
      window.alert(
        `This collection still contains ${linkedProducts.length} product${linkedProducts.length === 1 ? '' : 's'}. Move those products to another collection before deleting it.`
      );
      return;
    }
    if (confirm(`Are you sure you want to remove collection "${name}"? This will update both the website and mobile app.`)) {
      try {
        await deleteCategory(id);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'The collection could not be deleted.');
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg text-navy">Collections & Categories Manager</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo border border-indigo-200">
              {categories.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create and edit master catalog collections. Changes instantly reflect across both the <strong>Website</strong> and <strong>Flutter Mobile App</strong>.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Product counts help you see what is inside each collection. Move products before deleting a collection.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo hover:bg-indigo-dark text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Collection</span>
        </button>
      </div>

      {/* Grid of Collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            {/* Image Banner */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent"></div>

              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white/90 text-navy backdrop-blur-xs flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5 text-indigo" /> Web
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-white flex items-center gap-1">
                  <Smartphone className="w-2.5 h-2.5" /> App Live
                </span>
              </div>

              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 bg-white/90 hover:bg-white text-navy rounded-lg transition shadow-xs cursor-pointer"
                  title="Edit Collection"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo" />
                </button>
                {categories.length > 1 && (
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-lg transition shadow-xs cursor-pointer"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Collection Name on Image */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h4 className="font-extrabold text-base leading-tight text-white">{cat.name}</h4>
                {cat.tagline && (
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{cat.tagline}</p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {cat.description || 'Direct mill woven collection crafted in Ahmedabad manufacturing unit.'}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {products.filter(product => productBelongsToCollection(product, cat.id)).length} products assigned
              </p>

              {/* Subcategories list */}
              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {cat.subcategories.map((sub, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-premium space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-navy">
                {editingId ? 'Edit Collection Details' : 'Create New Master Collection'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {formError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  {formError}
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Collection Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Designer Kurtis & Dress Materials"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Category Image URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or /assets/images/category.jpg"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo font-mono text-[11px]"
                />
                {formData.image && (
                  <div className="mt-2 w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description for buyer overview..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                ></textarea>
              </div>

              <p className="rounded-xl bg-indigo-50 px-3 py-2 text-[11px] text-indigo-900">
                Add products to this collection from the Products tab. Subcategories are managed on each product.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo hover:bg-indigo-dark disabled:opacity-60 text-white font-bold rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Collection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
