import { createContext, useContext, useEffect, useState } from 'react';

const CART_STORAGE_KEY = 'inalog-silog-cart';

const CartContext = createContext(null);

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredCartState() {
    if (!canUseStorage()) {
        return {
            items: [],
            orderMode: 'delivery',
        };
    }

    try {
        const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);

        if (!rawValue) {
            return {
                items: [],
                orderMode: 'delivery',
            };
        }

        const parsedValue = JSON.parse(rawValue);

        return {
            items: Array.isArray(parsedValue?.items) ? parsedValue.items.filter((item) => item?.name) : [],
            orderMode: parsedValue?.orderMode === 'pickup' ? 'pickup' : 'delivery',
        };
    } catch {
        return {
            items: [],
            orderMode: 'delivery',
        };
    }
}

export function CartProvider({ children }) {
    const [cartState, setCartState] = useState(readStoredCartState);

    useEffect(() => {
        if (!canUseStorage()) {
            return;
        }

        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    }, [cartState]);

    function addItem(menuItem, quantity = 1) {
        setCartState((currentState) => {
            const existingItem = currentState.items.find((item) => item.name === menuItem.name);

            if (existingItem) {
                return {
                    ...currentState,
                    items: currentState.items.map((item) =>
                        item.name === menuItem.name
                            ? {
                                  ...item,
                                  quantity: item.quantity + quantity,
                              }
                            : item,
                    ),
                };
            }

            return {
                ...currentState,
                items: [
                    ...currentState.items,
                    {
                        name: menuItem.name,
                        price: menuItem.price,
                        image: menuItem.image,
                        badge: menuItem.badge,
                        description: menuItem.description,
                        quantity,
                    },
                ],
            };
        });
    }

    function updateQuantity(itemName, nextQuantity) {
        const safeQuantity = Number(nextQuantity) || 0;

        setCartState((currentState) => {
            if (safeQuantity <= 0) {
                return {
                    ...currentState,
                    items: currentState.items.filter((item) => item.name !== itemName),
                };
            }

            return {
                ...currentState,
                items: currentState.items.map((item) =>
                    item.name === itemName
                        ? {
                              ...item,
                              quantity: safeQuantity,
                          }
                        : item,
                ),
            };
        });
    }

    function removeItem(itemName) {
        setCartState((currentState) => ({
            ...currentState,
            items: currentState.items.filter((item) => item.name !== itemName),
        }));
    }

    function clearCart() {
        setCartState((currentState) => ({
            ...currentState,
            items: [],
        }));
    }

    function setOrderMode(nextMode) {
        setCartState((currentState) => ({
            ...currentState,
            orderMode: nextMode === 'pickup' ? 'pickup' : 'delivery',
        }));
    }

    const itemCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = itemCount > 0 && cartState.orderMode === 'delivery' ? 59 : 0;
    const serviceFee = itemCount > 0 ? 29 : 0;
    const grandTotal = subtotal + deliveryFee + serviceFee;
    const etaText = itemCount > 0 ? (cartState.orderMode === 'delivery' ? '15 min' : '10 min') : '--';

    const value = {
        items: cartState.items,
        orderMode: cartState.orderMode,
        itemCount,
        subtotal,
        deliveryFee,
        serviceFee,
        grandTotal,
        etaText,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        setOrderMode,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used inside CartProvider.');
    }

    return context;
}
