import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, Phone, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';

export default function BookingForm({ pricePerDay }: { pricePerDay: number }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [bookedIntervals, setBookedIntervals] = useState<{start: Date, end: Date}[]>([]);

  const fetchBookedDates = async () => {
    try {
      const res = await fetch('/api/bookings/dates');
      if (res.ok) {
        const data = await res.json();
        const intervals = data.map((d: any) => ({
          start: new Date(d.start),
          end: new Date(d.end)
        }));
        setBookedIntervals(intervals);
      }
    } catch (err) {
      console.error('Failed to fetch booked dates:', err);
    }
  };

  useEffect(() => {
    fetchBookedDates();
  }, [status]);

  const getNextBookedDate = () => {
    if (!formData.startDate) return undefined;
    const futureIntervals = bookedIntervals
      .filter(interval => interval.start > formData.startDate!)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
      
    if (futureIntervals.length > 0) {
      return new Date(futureIntervals[0].start.getTime() - 24 * 60 * 60 * 1000);
    }
    return undefined;
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diffTime = Math.abs(formData.endDate.getTime() - formData.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const days = calculateDays();
  const total = days * pricePerDay;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      setStatus('error');
      setErrorMessage('Vui lòng chọn ngày nhận và ngày trả xe');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Adjust for timezone offset to get correct local date string
      const start = new Date(formData.startDate.getTime() - (formData.startDate.getTimezoneOffset() * 60000));
      const end = new Date(formData.endDate.getTime() - (formData.endDate.getTimezoneOffset() * 60000));

      const payload = {
        ...formData,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Đặt xe thất bại');
      }

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 text-center shadow-xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Đã yêu cầu đặt xe!</h3>
        <p className="text-slate-600 mb-8">
          Cảm ơn bạn, {formData.name}. Chúng tôi đã nhận được yêu cầu thuê xe VF 5 Plus trong {days} ngày. Đội ngũ của chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận.
        </p>
        <button
          onClick={() => {
            setStatus('idle');
            setFormData({ name: '', email: '', phone: '', startDate: null, endDate: null });
          }}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          Đặt xe khác
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Đặt xe VF 5 của bạn</h3>
      
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhận xe</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date, endDate: null })}
                selectsStart
                startDate={formData.startDate || undefined}
                endDate={formData.endDate || undefined}
                minDate={new Date()}
                excludeDateIntervals={bookedIntervals}
                locale={vi}
                dateFormat="dd/MM/yyyy"
                placeholderText="Chọn ngày nhận"
                className="block w-full rounded-xl border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                wrapperClassName="w-full"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày trả xe</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                selectsEnd
                startDate={formData.startDate || undefined}
                endDate={formData.endDate || undefined}
                minDate={formData.startDate || new Date()}
                maxDate={getNextBookedDate()}
                excludeDateIntervals={bookedIntervals}
                locale={vi}
                dateFormat="dd/MM/yyyy"
                placeholderText="Chọn ngày trả"
                className="block w-full rounded-xl border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:bg-slate-50"
                wrapperClassName="w-full"
                disabled={!formData.startDate}
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full rounded-xl border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                required
                placeholder="nguyenvana@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full rounded-xl border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="tel"
                required
                placeholder="0901234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="block w-full rounded-xl border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>
      </div>

      {status === 'error' && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <span className="text-slate-600">Tổng cộng cho {days} ngày</span>
          <span className="text-2xl font-bold text-slate-900">{total.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        
        <button
          type="submit"
          disabled={status === 'loading' || days === 0}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {status === 'loading' ? 'Đang xử lý...' : 'Yêu cầu đặt xe'}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </form>
  );
}
