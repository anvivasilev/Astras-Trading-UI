import { OrderbookRequest } from "../models/orderbook-request.model";
import { Order } from "../../../shared/models/orders/order.model";
import { Side } from "../../../shared/models/enums/side.model";
import { CurrentOrder } from "../models/scalper-order-book.model";

export class OrderBookDataFeedHelper {
  public static getRealtimeDateRequest(trackId: string,
                                       symbol: string,
                                       exchange: string,
                                       instrumentGroup?: string,
                                       depth?: number): OrderbookRequest {
    const request: OrderbookRequest = {
      opcode: 'OrderBookGetAndSubscribe',
      code: symbol,
      exchange: exchange,
      depth: depth ?? 10,
      format: 'slim',
      guid: trackId,
      instrumentGroup: instrumentGroup,
    };

    return request;
  }

  public static getCurrentOrdersForItem(itemPrice: number, side: Side, orders: Order[]): CurrentOrder[] {
    const currentOrders = orders.filter(
      (o) => o.side === side
        && o.price === itemPrice
        && o.status === 'working'
    );

    return currentOrders.map(o => this.orderToCurrentOrder(o));
  }

  public static orderToCurrentOrder(order: Order): CurrentOrder {
    return {
      orderId: order.id,
      exchange: order.exchange,
      portfolio: order.portfolio,
      price: order.price,
      volume: order.qty,
      type: order.type
    } as CurrentOrder;
  }
}
