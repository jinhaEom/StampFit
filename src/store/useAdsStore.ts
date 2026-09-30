import { REMOVE_ADS_SKU } from '@/constants/iap';
import {
  ErrorCode,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'react-native-iap';
import { create } from 'zustand';

interface AdsState {
  adsRemoved: boolean; // true면 배너 광고 숨김
  iapReady: boolean;
  purchasing: boolean;
  init: () => Promise<void>;
  purchaseRemoveAds: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

let listenersAttached = false;

export const useAdsStore = create<AdsState>((set, get) => ({
  adsRemoved: false,
  iapReady: false,
  purchasing: false,

  init: async () => {
    try {
      await initConnection();
      set({ iapReady: true });

      if (!listenersAttached) {
        listenersAttached = true;

        purchaseUpdatedListener(async (purchase) => {
          if (purchase.productId !== REMOVE_ADS_SKU) return;
          try {
            await finishTransaction({ purchase, isConsumable: false });
            set({ adsRemoved: true });
          } finally {
            set({ purchasing: false });
          }
        });

        purchaseErrorListener((error) => {
          if (error.code !== ErrorCode.UserCancelled) {
            console.warn('IAP 구매 실패', error);
          }
          set({ purchasing: false });
        });
      }

      await get().restorePurchases();
    } catch (e) {
      console.warn('IAP 초기화 실패', e);
    }
  },

  purchaseRemoveAds: async () => {
    if (!get().iapReady || get().purchasing) return;
    set({ purchasing: true });
    try {
      await requestPurchase({
        request: { apple: { sku: REMOVE_ADS_SKU }, google: { skus: [REMOVE_ADS_SKU] } },
        type: 'in-app',
      });
    } catch (e) {
      console.warn('구매 요청 실패', e);
      set({ purchasing: false });
    }
  },

  restorePurchases: async () => {
    try {
      const purchases = await getAvailablePurchases();
      if (purchases.some((p) => p.productId === REMOVE_ADS_SKU)) {
        set({ adsRemoved: true });
      }
    } catch (e) {
      console.warn('구매 내역 복원 실패', e);
    }
  },
}));
