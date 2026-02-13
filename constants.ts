
import { Product, Service, User, UserTier, Order, AdminLog } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Adonis Survival Kit',
    nameAr: 'طقم أدونيس للطوارئ',
    description: 'The ultimate emergency kit for power & water cuts. Includes power bank (20k mAh), rechargeable LED lantern, 5L water, and dry snacks.',
    descriptionAr: 'الطقم المثالي لإنقطاع الكهرباء والمياه. يتضمن باور بانك (20 ألف ميلي أمبير)، فانوس ليد قابل للشحن، 5 لتر مياه، وسناكس.',
    price: 85,
    cost: 55,
    stock: 12,
    category: 'emergency',
    image: 'https://picsum.photos/400/400?random=1',
    tags: ['Power Cut', 'Emergency'],
    isActive: true
  },
  {
    id: '2',
    name: 'Beirut Morning Kit',
    nameAr: 'ترويقة بيروتية',
    description: 'Premium Labneh, Zaatar, Olive Oil from Koura, Fresh Bread, and organic coffee. Breakfast sorted.',
    descriptionAr: 'لبنة فاخرة، زعتر، زيت زيتون كوراني، خبز طازج، وقهوة عضوية. فطورك جاهز.',
    price: 35,
    cost: 18,
    stock: 40,
    category: 'essential',
    image: 'https://picsum.photos/400/400?random=2',
    tags: ['Breakfast', 'Daily'],
    isActive: true
  },
  {
    id: '3',
    name: 'Habibi Valentine Box',
    nameAr: 'صندوق "حبيبي"',
    description: 'Luxury red roses, Belgian chocolate, and a personalized gold-plated card. Delivered in a velvet box.',
    descriptionAr: 'ورود حمراء فاخرة، شوكولا بلجيكية، وبطاقة ذهبية مخصصة. تصلك في صندوق مخملي.',
    price: 150,
    cost: 90,
    stock: 5,
    category: 'themed',
    image: 'https://picsum.photos/400/400?random=3',
    tags: ['Gift', 'Love'],
    isActive: true
  },
  {
    id: '4',
    name: 'Sunday BBQ Feast',
    nameAr: 'مشاوي الأحد',
    description: 'Marinated Taouk, Kafta, Hommos, Tabbouleh ingredients, and charcoal. Ready for the grill.',
    descriptionAr: 'طاووق متبل، كفتة، حمص، مكونات التبولة، وفحم. جاهز للشوي.',
    price: 70,
    cost: 45,
    stock: 20,
    category: 'essential',
    image: 'https://picsum.photos/400/400?random=4',
    tags: ['Food', 'Weekend'],
    isActive: true
  },
  {
    id: '5',
    name: 'Newborn "Mabrouk" Kit',
    nameAr: 'طقم "مبروك" للمولود',
    description: 'Premium diapers, organic onesies, soft toys, and self-care items for the mom.',
    descriptionAr: 'حفاضات فاخرة، ملابس عضوية، ألعاب ناعمة، ومنتجات عناية للأم.',
    price: 120,
    cost: 80,
    stock: 8,
    category: 'themed',
    image: 'https://picsum.photos/400/400?random=5',
    tags: ['Baby', 'Gift'],
    isActive: true
  }
];

export const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Express Electrician', nameAr: 'كهربائي سريع', type: 'electrician', basePrice: 20, available: true },
  { id: 's2', name: 'Plumbing Emergency', nameAr: 'طوارئ صحية', type: 'plumber', basePrice: 25, available: true },
  { id: 's3', name: 'AC Maintenance', nameAr: 'صيانة مكيفات', type: 'maintenance', basePrice: 30, available: true },
];

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Jad El-Khoury',
  email: 'jad@example.com',
  phone: '+961 3 123456',
  address: 'Adonis, Zone B, St. Charbel Bldg, 4th Floor',
  walletBalance: 0, 
  points: 12450,
  tier: UserTier.ELITE,
  isAdmin: false,
  joinDate: '2023-08-15',
  status: 'active'
};

export const ADMIN_PASSWORD = "969696";

// --- Admin Mock Data ---

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-7782',
    userId: 'u1',
    userName: 'Jad El-Khoury',
    items: [{...MOCK_PRODUCTS[0], quantity: 1}, {...MOCK_PRODUCTS[1], quantity: 2}],
    total: 155,
    status: 'delivering',
    date: '2023-10-25 09:30',
    paymentMethod: 'cash',
    deliveryZone: 'Adonis - Zone A'
  },
  {
    id: 'ORD-7783',
    userId: 'u2',
    userName: 'Sarah Maalouf',
    items: [{...MOCK_PRODUCTS[2], quantity: 1}],
    total: 150,
    status: 'preparing',
    date: '2023-10-25 10:15',
    paymentMethod: 'card',
    deliveryZone: 'Zouk Mosbeh'
  },
  {
    id: 'ORD-7781',
    userId: 'u3',
    userName: 'Karim Saliba',
    items: [{...MOCK_PRODUCTS[3], quantity: 1}],
    total: 70,
    status: 'completed',
    date: '2023-10-24 18:00',
    paymentMethod: 'wallet',
    deliveryZone: 'Adonis - Zone B'
  },
  {
    id: 'ORD-7780',
    userId: 'u4',
    userName: 'Nadia Hage',
    items: [{...MOCK_PRODUCTS[1], quantity: 1}],
    total: 35,
    status: 'cancelled',
    date: '2023-10-24 14:20',
    paymentMethod: 'cash',
    deliveryZone: 'Adonis - Zone A'
  }
];

export const MOCK_LOGS: AdminLog[] = [
  { id: 'l1', action: 'System Update v2.1 Deployed', adminName: 'System', timestamp: '10:00 AM', type: 'info' },
  { id: 'l2', action: 'Changed price of "Survival Kit"', adminName: 'Rami (Ops)', timestamp: '09:45 AM', type: 'warning' },
  { id: 'l3', action: 'Refunded Order #ORD-7780', adminName: 'Maya (Support)', timestamp: '09:15 AM', type: 'critical' },
  { id: 'l4', action: 'New User Registration: Sarah Maalouf', adminName: 'System', timestamp: '08:30 AM', type: 'info' }
];
