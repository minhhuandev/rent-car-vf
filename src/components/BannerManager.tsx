import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Image as ImageIcon, Upload } from 'lucide-react';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
}

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banners');
      if (!res.ok) throw new Error('Không thể tải danh sách banner');
      const data = await res.json();
      setBanners(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Vui lòng chọn một ảnh');
      return;
    }

    setAdding(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('title', newBanner.title);
      formData.append('subtitle', newBanner.subtitle);
      formData.append('image', imageFile);

      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!res.ok) throw new Error('Không thể thêm banner');
      
      const addedBanner = await res.json();
      setBanners([...banners, addedBanner]);
      setNewBanner({ title: '', subtitle: '' });
      setImageFile(null);
      setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Không thể xóa banner');
      
      setBanners(banners.filter(b => b.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Thêm Banner Mới</h2>
        <form onSubmit={handleAddBanner} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tải ảnh lên</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl relative hover:bg-slate-50 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative w-full h-32 mb-4">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    </div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  )}
                  <div className="flex text-sm text-slate-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                    >
                      <span>{imagePreview ? 'Thay đổi ảnh' : 'Tải lên một file'}</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG, GIF tối đa 10MB</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  required
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  className="block w-full rounded-xl border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Tiêu đề banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phụ đề</label>
                <input
                  type="text"
                  value={newBanner.subtitle}
                  onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                  className="block w-full rounded-xl border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Phụ đề banner (Không bắt buộc)"
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={adding}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {adding ? 'Đang thêm...' : 'Thêm Banner'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Banner Hiện tại</h2>
        
        {loading ? (
          <div className="text-center py-8 text-slate-500">Đang tải banner...</div>
        ) : error ? (
          <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">{error}</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Không tìm thấy banner nào.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <motion.div 
                key={banner.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
              >
                <div className="aspect-video w-full bg-slate-100 relative">
                  {banner.imageUrl ? (
                    <img 
                      src={banner.imageUrl} 
                      alt={banner.title} 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-bold truncate">{banner.title}</h3>
                    <p className="text-xs text-slate-200 truncate">{banner.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBanner(banner.id)}
                  className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  title="Xóa Banner"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
