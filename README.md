# OnRamp Backend API

## 📖 Description

Proof-of-concept d'une API OnRamp permettant à des marchands français de recevoir des paiements par carte bancaire (EUR) via Stripe et de les convertir automatiquement en stablecoins USDC via Bridge, avec transfert vers un portefeuille crypto.

### 🎯 Contexte Business
- Marchands français vendant en ligne à des clients français
- Paiements reçus en EUR via carte bancaire (Stripe)
- Conversion automatique EUR → USDC via Bridge
- Transfert vers un portefeuille crypto prédéfini

## 🏗️ Architecture

### Design Provider-Agnostic
L'architecture permet de remplacer facilement Stripe ou Bridge par d'autres providers :
- **Interfaces abstraites** pour les services de paiement et conversion
- **Services modulaires** avec injection de dépendances
- **Types TypeScript stricts** pour la type-safety
- **Gestion d'erreurs centralisée** avec codes spécifiques

### Stack Technique
- **Runtime**: Node.js avec TypeScript
- **Framework**: NestJS
- **Validation**: Joi schemas
- **Paiements**: Stripe API
- **Conversion crypto**: Bridge API

## 🚀 Installation et Configuration

### 1. Prérequis
```bash
node >= 18
npm >= 9
```

### 2. Installation
```bash
git clone <repository>
cd onramp-backend
npm install
```

### 3. Variables d'environnement
Créez un fichier `.env` avec les clés sandbox :

```bash
# Stripe (Sandbox)
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRIVATE_KEY=sk_test_pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Bridge (Sandbox)
BRIDGE_API_KEY=sk-test-pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
BRIDGE_BASE_URL=https://api.sandbox.bridge.xyz/v0

# Wallet de destination
WALLET_ADDRESS=0x2B480c63bDe7C764cadBaA8b181405D770728128
```

### 4. Démarrage
```bash
# Mode développement avec watch
npm run start:dev

# Mode production
npm run start:prod
```

L'API sera disponible sur `http://localhost:3000`

## 🔄 Flow OnRamp Complet

### Étapes du processus
1. **Initiation** : Création du Payment Intent Stripe + transaction OnRamp
2. **Paiement** : Confirmation du paiement par carte via Stripe
3. **Conversion** : Initiation de la conversion EUR → USDC via Bridge
4. **Transfert** : Envoi des USDC vers le portefeuille de destination
5. **Confirmation** : Finalisation sur la blockchain

### Statuts trackés
- `payment_pending` → `conversion_pending` → `conversion_in_progress` → `transfer_pending` → `completed`

## 📡 API Endpoints

### OnRamp Operations

#### `POST /onramp/initiate`
Initie une nouvelle transaction OnRamp
```bash
curl -X POST http://localhost:3000/onramp/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "description": "Test OnRamp"
  }'
```

#### `GET /onramp/transactions`
Liste toutes les transactions
```bash
curl -X GET http://localhost:3000/onramp/transactions
```

#### `GET /onramp/status/{transactionId}`
Récupère le statut d'une transaction
```bash
curl -X GET http://localhost:3000/onramp/status/onramp_1234567890_abc123def
```

#### `POST /onramp/process-payment/{paymentIntentId}`
Traite la confirmation de paiement et lance la conversion
```bash
curl -X POST http://localhost:3000/onramp/process-payment/pi_3S1234567890
```

### Payment Operations (Stripe)

#### `POST /payment/confirm/{paymentIntentId}`
Simule la confirmation d'un paiement (sandbox uniquement)
```bash
curl -X POST http://localhost:3000/payment/confirm/pi_3S1234567890
```

#### `GET /payment/status/{paymentIntentId}`
Vérifie le statut d'un paiement Stripe
```bash
curl -X GET http://localhost:3000/payment/status/pi_3S1234567890
```

## 🧪 Démonstration Complète

### Scénario de test complet

#### 1. Initier un OnRamp
```bash
curl -X POST http://localhost:3000/onramp/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "description": "Démonstration OnRamp"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Transaction OnRamp initiée avec succès",
  "data": {
    "transactionId": "onramp_1756481142625_lpblwy6tm",
    "paymentIntentId": "pi_3S1UzaQpXOz7fYPX117CK0n9",
    "clientSecret": "pi_3S1UzaQpXOz7fYPX117CK0n9_secret_...",
    "amount": 50,
    "currency": "EUR",
    "status": "payment_pending"
  }
}
```

#### 2. Simuler le paiement Stripe
```bash
curl -X POST http://localhost:3000/payment/confirm/pi_3S1UzaQpXOz7fYPX117CK0n9
```

#### 3. Traiter la conversion crypto
```bash
curl -X POST http://localhost:3000/onramp/process-payment/pi_3S1UzaQpXOz7fYPX117CK0n9
```

#### 4. Vérifier le statut final
```bash
curl -X GET http://localhost:3000/onramp/status/onramp_1756481142625_lpblwy6tm
```

**Réponse finale attendue :**
```json
{
  "success": true,
  "message": "Statut récupéré avec succès",
  "data": {
    "transactionId": "onramp_1756481142625_lpblwy6tm",
    "status": "completed",
    "currentPhase": "completed",
    "amount": 50,
    "currency": "EUR",
    "targetAmount": 46,
    "walletAddress": "0x2B480c63bDe7C764cadBaA8b181405D770728128",
    "progress": {
      "step": 9,
      "percentage": 100
    },
    "statusHistory": [...]
  }
}
```

## 🔐 Sécurité

### Clés API
- Les clés Stripe et Bridge ne sont jamais exposées côté client
- Validation stricte des montants et formats
- Gestion robuste des erreurs sans exposition d'informations sensibles

### Validation
- Schémas Joi pour toutes les entrées utilisateur
- Validation des montants (min: 1€, max: 50,000€)
- Validation des formats d'adresses Ethereum

## 🛠️ Tests et Validation

### Tests des cas d'erreur
```bash
# Montant invalide
curl -X POST http://localhost:3000/onramp/initiate \
  -H "Content-Type: application/json" \
  -d '{"amount": 0}'

# Montant trop élevé
curl -X POST http://localhost:3000/onramp/initiate \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'
```

### Codes d'erreur
- `400` : Validation échouée ou données invalides
- `404` : Ressource introuvable
- `500` : Erreur serveur interne

## 📊 Monitoring et Logs

Le système inclut des logs détaillés pour chaque étape :
- Création des Payment Intents Stripe
- Appels API Bridge
- Transitions de statuts
- Erreurs et exceptions

## 🔧 Architecture Technique

### Structure du Code
```
src/
├── controllers/     # Endpoints REST
├── services/        # Logique métier
├── types/          # Interfaces TypeScript
├── enums/          # Énumérations de statuts
├── schemas/        # Validation Joi
├── constants/      # Configuration
└── filters/        # Gestion d'erreurs globale
```

### Extensibilité
Pour ajouter un nouveau provider :
1. Implémenter l'interface correspondante
2. Créer le service avec les mêmes méthodes
3. Injecter via le système de DI de NestJS

## 📝 License

Ce projet est développé dans le cadre d'un test technique et démontre les meilleures pratiques de développement d'API avec NestJS, TypeScript et intégrations tierces.
