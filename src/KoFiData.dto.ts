export interface KoFiData {
  "verification_token": string;             // "4ed70334-a412-4c44-9e6d-c02503bda845"
  "message_id": string;                     // "f0757906-9a08-4516-909c-82e87faf7f41"
  "timestamp": string;                        // "2025-05-23T08:32:22Z"
  "type": string;                           // "Donation"
  "is_public": boolean;                     // true
  "from_name": string;                      // "Jo Example"
  "message": string;                        // "Good luck with the integration!"
  "amount": string;                         // "3.00"
  "url": string;                            // "https://ko-fi.com/Home/CoffeeShop?txid=00000000-1111-2222-3333-444444444444"
  "email": string;                          // "jo.example@example.com"
  "currency": string;                       // "USD"
  "is_subscription_payment": boolean;       // false
  "is_first_subscription_payment": boolean; // false
  "kofi_transaction_id": string;            // "00000000-1111-2222-3333-444444444444"
  "shop_items": any;                        // null
  "tier_name": any;                         // null
  "shipping": any;                          // null
}