import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Cloud, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Building2, 
  Users 
} from 'lucide-react';

export const DeliverySettingsScreen: React.FC = () => {
  const {
    setCurrentScreen,
    selectedRestaurant,
    orders,
    products,
    firebaseProfile,
    loginWithGoogle,
    logoutGoogle,
  } = useApp();

  const restaurantTitle = 'Голодный Турист';

  return (
    <div className="w-full min-h-full flex-1 flex flex-col justify-between pb-24 select-none">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#FAF7EE]/95 backdrop-blur-md border-b border-[#E2D8C3] shadow-xs">
        <div className="w-full px-3 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('order')}
            className="flex items-center gap-1 text-xs font-bold text-stone-700 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>Назад</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-[#2A1E17]">
              Облачная синхронизация
            </span>
          </div>

          <div className="w-8" />
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 pt-4 flex-1 flex flex-col max-w-lg mx-auto space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-3xl border border-[#E2D8C3] shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Firebase Firestore Active
              </span>
              <h2 className="text-base font-black text-stone-900 mt-1">
                Единая облачная база подключена
              </h2>
            </div>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Все заказы, каталог продуктов и технологические карты синхронизируются в реальном времени между всеми смартфонами и устройствами ресторанов.
          </p>
        </div>

        {/* User Account / Google Sign-In */}
        <div className="bg-white rounded-3xl border border-[#E2D8C3] shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-stone-900">Учётная запись</h3>
            </div>
            {firebaseProfile ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                {firebaseProfile.role === 'superadmin' ? 'Владелец' : 'Сотрудник'}
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                Кухонное устройство
              </span>
            )}
          </div>

          {firebaseProfile ? (
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-bold text-stone-900">{firebaseProfile.displayName}</div>
                <div className="text-[11px] text-stone-500">{firebaseProfile.email}</div>
              </div>
              <button
                onClick={logoutGoogle}
                className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition-colors cursor-pointer"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="pt-1">
              <p className="text-xs text-stone-600 mb-3">
                Авторизуйтесь через Google, если требуется доступ владельца (Avakartsuk@gmail.com) или управление без ввода PIN-кода.
              </p>
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-stone-800 bg-stone-50 hover:bg-stone-100 px-4 py-2.5 rounded-2xl border border-stone-300 shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <span>Войти через Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Current Restaurant Info */}
        <div className="bg-white rounded-3xl border border-[#E2D8C3] shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                Текущий ресторан
              </span>
            </div>
            <span className="text-xs font-bold text-stone-700">
              🧭 Ресторан «Голодный Турист»
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-center">
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <div className="text-xl font-black text-stone-900">{orders.length}</div>
              <div className="text-[11px] text-stone-500 font-bold">Заказов в базе</div>
            </div>
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <div className="text-xl font-black text-stone-900">{products.length}</div>
              <div className="text-[11px] text-stone-500 font-bold">Товаров в каталоге</div>
            </div>
          </div>
        </div>

        {/* Flow Description */}
        <div className="bg-white rounded-3xl border border-[#E2D8C3] shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-stone-800">
            <Copy className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-black">Регламент отправки заказов</h3>
          </div>
          <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Заказ формируется сотрудником в приложении и сохраняется в общую базу.</li>
            <li>На экране бланка нажимается кнопка <b>«Скопировать заказ»</b>.</li>
            <li>Форматированный текст таблицы копируется в буфер обмена устройства.</li>
            <li>Сотрудник открывает Telegram или нужный чат и вставляет готовый текст.</li>
          </ol>
        </div>

        {/* Rules & Deadline */}
        <div className="bg-white rounded-3xl border border-[#E2D8C3] shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2 text-stone-800">
            <Clock className="w-4 h-4 text-stone-500" />
            <h3 className="text-sm font-black">Дедлайн редактирования: 07:00</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Заказ, созданный вечером или ночью, доступен для редактирования до 07:00 утра следующего дня. После 07:00 состав заказа фиксируется для закупки и защищён правилами базы данных.
          </p>
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-3xl border border-[#E2D8C3] shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2 text-stone-800">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm font-black">Административный доступ</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Управление техкартами защищено PIN 060926. Управление каталогом товаров и административные функции заказов защищены PIN 260906.
          </p>
        </div>
      </div>
    </div>
  );
};
