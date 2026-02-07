/**
 * 支付接口
 * 
 * 所有支付方式都需要实现这个接口
 */
export interface IPaymentProvider {
  /**
   * 创建支付订单
   */
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;

  /**
   * 查询订单状态
   */
  queryOrder(orderNumber: string): Promise<OrderQueryResult>;

  /**
   * 处理支付回调
   */
  handleCallback(data: any): Promise<CallbackResult>;
}

export interface CreateOrderParams {
  userId: string;
  planType: 'FREE' | 'UNLIMITED';
  amount: number;
  paymentMethod: 'WECHAT' | 'ALIPAY' | 'YIPAY';
}

export interface CreateOrderResult {
  orderNumber: string;
  paymentUrl?: string; // 支付链接（自动支付）
  qrCodeUrl?: string;  // 二维码链接（手动支付）
  amount: number;
}

export interface OrderQueryResult {
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paidAt?: Date;
}

export interface CallbackResult {
  success: boolean;
  orderNumber: string;
  message?: string;
}
