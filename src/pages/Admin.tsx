import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CheckCircle2, XCircle, Clock, LayoutDashboard, Image as ImageIcon, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BannerManager from '../components/BannerManager';

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'banners' | 'settings'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pricePerDay, setPricePerDay] = useState<number>(1000000);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/login');
          return;
        }
        throw new Error('Không thể tải danh sách đặt xe');
      }
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/car');
      if (res.ok) {
        const data = await res.json();
        setPricePerDay(data.pricePerDay);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
      
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus as any } : b));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSavePrice = async () => {
    setIsSavingPrice(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/car/price', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ price: pricePerDay })
      });
      if (!res.ok) throw new Error('Không thể cập nhật giá');
      alert('Đã cập nhật giá thuê xe thành công!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><CheckCircle2 className="h-3 w-3" /> Đã xác nhận</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10"><XCircle className="h-3 w-3" /> Đã hủy</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20"><Clock className="h-3 w-3" /> Chờ xử lý</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center justify-between mb-8">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold leading-6 text-slate-900">Bảng điều khiển Quản trị</h1>
            <p className="mt-2 text-sm text-slate-600">
              Quản lý các yêu cầu thuê xe và nội dung trang web.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2
                ${activeTab === 'bookings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }
              `}
            >
              <LayoutDashboard className="h-4 w-4" />
              Quản lý Đặt xe
            </button>
            <button
              onClick={() => setActiveTab('banners')}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2
                ${activeTab === 'banners'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }
              `}
            >
              <ImageIcon className="h-4 w-4" />
              Quản lý Banner
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2
                ${activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }
              `}
            >
              <Settings className="h-4 w-4" />
              Cài đặt
            </button>
          </nav>
        </div>

        {activeTab === 'bookings' ? (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={fetchBookings}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-2xl bg-white">
                    <table className="min-w-full divide-y divide-slate-300">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">ID</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Khách hàng</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Thời gian thuê</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Trạng thái</th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Thao tác</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {bookings.length === 0 && !loading ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                              Chưa có yêu cầu đặt xe nào.
                            </td>
                          </tr>
                        ) : (
                          bookings.map((booking) => (
                            <motion.tr 
                              key={booking.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                                #{booking.id.toUpperCase()}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                <div className="font-medium text-slate-900">{booking.name}</div>
                                <div>{booking.email}</div>
                                <div>{booking.phone}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                <div>Từ: {booking.startDate}</div>
                                <div>Đến: {booking.endDate}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                {getStatusBadge(booking.status)}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                {booking.status === 'pending' && (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => updateStatus(booking.id, 'confirmed')}
                                      className="text-emerald-600 hover:text-emerald-900"
                                    >
                                      Xác nhận
                                    </button>
                                    <button
                                      onClick={() => updateStatus(booking.id, 'cancelled')}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'banners' ? (
          <BannerManager />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Cài đặt chung</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giá thuê xe mỗi ngày (VNĐ)
                </label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(parseInt(e.target.value) || 0)}
                      className="block w-full rounded-xl border-0 py-2.5 px-4 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <button
                    onClick={handleSavePrice}
                    disabled={isSavingPrice}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {isSavingPrice ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Giá này sẽ được hiển thị trên trang chủ và dùng để tính tổng tiền khi khách hàng đặt xe.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
