export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PICKING' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export type UnitType = 'dona' | 'quti' | 'kg' | 'litr';

export type CustomerSegment = 'VIP' | 'REGULAR' | 'NEW' | 'WHOLESALE' | 'RISKY';

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  price: number;
  wholesalePrice: number;
  discountPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  status: ProductStatus;
  images: string[];
  unit: UnitType;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  managerName: string;
  totalItems: number;
  capacity: number;
  code: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  fromWarehouseId?: string;
  fromWarehouseName?: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  date: string;
  performedBy: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  storeName: string;
  phone: string;
  email?: string;
  address: string;
  territoryId: string;
  territoryName: string;
  debt: number;
  creditLimit: number;
  segment: CustomerSegment;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'AGENT' | 'COURIER' | 'MANAGER';
  territoryId?: string;
  territoryName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar: string;
  hireDate: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderTimelineItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface OrderReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  storeName: string;
  agentId: string;
  agentName: string;
  courierId?: string;
  courierName?: string;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  territoryId: string;
  deliveryDate: string;
  createdAt: string;
  notes?: string;
  timeline: OrderTimelineItem[];
  payments: Payment[];
  returns?: OrderReturnItem[];
}

export interface Territory {
  id: string;
  name: string;
  region: string;
  managerId: string;
  managerName: string;
  activeAgentsCount: number;
  activeCouriersCount: number;
}

export interface Payment {
  id: string;
  orderId?: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER';
  date: string;
  collectorId: string;
  collectorName: string;
}

export interface GpsLocation {
  userId: string;
  userName: string;
  role: 'AGENT' | 'COURIER';
  latitude: number;
  longitude: number;
  lastUpdated: string;
  batteryLevel: number;
  speed: number;
  vehicleNumber: string;
  distanceTraveled: number;
  routeHistory: { lat: number; lng: number; time: string }[];
}

export interface DashboardStats {
  dailySales: number;
  dailySalesChange: number;
  weeklySales: number;
  monthlySales: number;
  activeOrders: number;
  deliveriesCount: number;
  totalDebt: number;
  lowStockItemsCount: number;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  trigger: string;
  channel: 'SMS' | 'TELEGRAM' | 'PUSH';
  content: string;
  active: boolean;
}

export interface PricingSetting {
  id: string;
  tierName: string;
  markupPercentage: number;
  minOrderAmount: number;
  active: boolean;
}
