import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Battery, Zap, Shield, ChevronLeft, ChevronRight, MapPin, Phone, Mail, Clock } from 'lucide-react';
import BookingForm from '../components/BookingForm';

interface CarDetails {
  model: string;
  type: string;
  batteryCapacity: string;
  range: string;
  power: string;
  torque: string;
  pricePerDay: number;
  features: string[];
}

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
}

export default function Home() {
  const [carDetails, setCarDetails] = useState<CarDetails | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    fetch('/api/car')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('API returned error:', data.error);
        } else {
          setCarDetails(data);
        }
      })
      .catch(err => console.error('Failed to fetch car details:', err));

    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setBanners(data);
        } else {
          // Fallback banner if none exist
          setBanners([{
            id: 'fallback',
            imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=2072&auto=format&fit=crop',
            title: 'Trải nghiệm Tương lai cùng VinFast VF 5',
            subtitle: 'Nhỏ gọn, thông minh và 100% điện. Thuê VinFast VF 5 Plus ngay hôm nay để tận hưởng trải nghiệm lái xe mượt mà, thân thiện với môi trường trong thành phố.'
          }]);
        }
      })
      .catch(err => console.error('Failed to fetch banners:', err));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const currentBanner = banners[currentBannerIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section with Carousel */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-20 pb-32 min-h-[600px] flex items-center">
        <AnimatePresence mode="wait">
          {currentBanner && (
            <motion.div
              key={currentBanner.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 z-0"
            >
              <div className="absolute inset-0 bg-black/50 z-10 mix-blend-multiply"></div>
              <img 
                src={currentBanner.imageUrl} 
                alt={currentBanner.title} 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel Controls */}
        {banners.length > 1 && (
          <>
            <button 
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 hover:text-white backdrop-blur-sm transition-all"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button 
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 hover:text-white backdrop-blur-sm transition-all"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            
            {/* Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`h-2 rounded-full transition-all ${idx === currentBannerIndex ? 'w-8 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </>
        )}
        
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              key={`text-${currentBannerIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-6 border border-blue-500/30">
                <Zap className="h-4 w-4" />
                100% Điện
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                {currentBanner?.title || 'Trải nghiệm Tương lai cùng VinFast VF 5'}
              </h1>
              <p className="text-lg text-slate-200 mb-8 max-w-xl">
                {currentBanner?.subtitle || 'Nhỏ gọn, thông minh và 100% điện. Thuê VinFast VF 5 Plus ngay hôm nay để tận hưởng trải nghiệm lái xe mượt mà, thân thiện với môi trường trong thành phố.'}
              </p>
              
              {carDetails && carDetails.range && carDetails.power && (
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div>
                    <div className="text-3xl font-bold text-white">{carDetails.range.split(' ')[0]}</div>
                    <div className="text-sm text-slate-400">km Quãng đường</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{carDetails.power.split(' ')[0]}</div>
                    <div className="text-sm text-slate-400">Mã lực</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">{(carDetails.pricePerDay || 1000000).toLocaleString('vi-VN')}</div>
                    <div className="text-sm text-slate-400">VNĐ / ngày</div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 opacity-30 blur-xl"></div>
              <div className="relative rounded-2xl bg-white/10 p-6 backdrop-blur-xl border border-white/20 shadow-2xl">
                <BookingForm pricePerDay={carDetails?.pricePerDay || 1000000} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Tại sao chọn VF 5 Plus?</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Được thiết kế cho lối sống đô thị hiện đại, VF 5 Plus tích hợp công nghệ tiên tiến vào một chiếc A-SUV nhỏ gọn, phong cách.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 transition-shadow hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                <Battery className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Pin Hiệu Quả</h3>
              <p className="text-slate-600">
                Được trang bị pin 37.23 kWh, cung cấp phạm vi lên tới 326 km cho một lần sạc. Hoàn hảo cho việc đi lại trong thành phố và những chuyến đi cuối tuần.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 transition-shadow hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">An Toàn Tiên Tiến</h3>
              <p className="text-slate-600">
                Trang bị Hệ thống Hỗ trợ Lái xe Nâng cao (ADAS) toàn diện bao gồm giám sát điểm mù và cảnh báo phương tiện cắt ngang phía sau.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 transition-shadow hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Công Nghệ Thông Minh</h3>
              <p className="text-slate-600">
                Luôn kết nối với màn hình giải trí 8 inch, trợ lý ảo thông minh và tích hợp điện thoại thông minh liền mạch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Liên hệ với chúng tôi</h2>
          <p className="text-slate-400 mb-12 text-lg">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 transition-colors hover:bg-white/10">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 border border-blue-500/30">
                <Phone className="h-5 w-5 text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Hotline</h4>
              <p className="text-slate-300">090 123 4567</p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 transition-colors hover:bg-white/10">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 border border-purple-500/30">
                <MapPin className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Địa chỉ</h4>
              <p className="text-slate-300">TP. Hồ Chí Minh</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-950 py-8 border-t border-white/10 text-center">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} VF5 Rent. Đã đăng ký bản quyền.
        </p>
      </footer>
    </div>
  );
}
