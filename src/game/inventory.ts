import { Emitter } from '../core/emitter';
import { loadJSON, randomId, saveJSON } from '../core/storage';
import { isFood } from './items';
import type { ItemId, MapId } from './maps/types';

export const SLOT_COUNT = 3;
const MAX_DROPS = 120;
const STORAGE_KEY = 'bl.inventory.v1';

export type Payment = 'cash' | 'points' | 'swipes';
export interface GroundItem {
  id: string;
  map: MapId;
  x: number;
  y: number;
  item: ItemId;
}

interface InventoryState {
  slots: (ItemId | null)[];
  selected: number;
  wallet: Record<Payment, number>;
  drops: GroundItem[];
}

export class PlayerInventory extends Emitter<{ change: () => void }> {
  constructor(private state: InventoryState = PlayerInventory.initial(), private save: (state: InventoryState) => void = () => {}) {
    super();
  }

  static initial(): InventoryState {
    return { slots: [null, null, null], selected: 0, wallet: { cash: 40, points: 4, swipes: 1 }, drops: [] };
  }

  get slots(): readonly (ItemId | null)[] { return this.state.slots; }
  get selected() { return this.state.selected; }
  get held() { return this.slots[this.selected]; }
  get wallet(): Readonly<Record<Payment, number>> { return this.state.wallet; }
  dropsOn(map: MapId) { return this.state.drops.filter((drop) => drop.map === map); }

  select(slot: number, swap = false) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT || slot === this.selected) return;
    const slots = [...this.slots];
    if (swap) [slots[slot], slots[this.selected]] = [slots[this.selected], slots[slot]];
    this.commit({ selected: slot, slots });
  }

  private store(item: ItemId, wallet = this.state.wallet): boolean {
    const index = this.held ? this.slots.indexOf(null) : this.selected;
    if (index < 0) return false;
    const slots = [...this.slots];
    slots[index] = item;
    this.commit({ slots, selected: index, wallet });
    return true;
  }

  take(item: ItemId) { return this.store(item); }

  buy(item: ItemId, payment: Payment, price: number): boolean {
    if (this.wallet[payment] < price) return false;
    return this.store(item, { ...this.wallet, [payment]: this.wallet[payment] - price });
  }

  buyPlan(price: number, swipes: number, points: number): boolean {
    if (this.wallet.cash < price) return false;
    this.commit({ wallet: { cash: this.wallet.cash - price, swipes: this.wallet.swipes + swipes, points: this.wallet.points + points } });
    return true;
  }

  pay(payment: Payment, price: number): boolean {
    if (this.wallet[payment] < price) return false;
    this.commit({ wallet: { ...this.wallet, [payment]: this.wallet[payment] - price } });
    return true;
  }

  eat(): ItemId | null {
    const item = this.held;
    if (!item || !isFood(item)) return null;
    this.clearHeld();
    return item;
  }

  drop(map: MapId, x: number, y: number): boolean {
    if (!this.held || this.state.drops.length >= MAX_DROPS) return false;
    this.clearHeld([...this.state.drops, { map, x, y, item: this.held, id: randomId() }]);
    return true;
  }

  pickUp(map: MapId, id: string) {
    const drop = this.state.drops.find((d) => d.map === map && d.id === id);
    if (!drop) return null;
    const free = this.held ? this.slots.indexOf(null) : this.selected;
    const slot = free === -1 ? this.selected : free;
    const displaced = this.slots[slot];
    const slots = [...this.slots];
    slots[slot] = drop.item;
    const drops = this.state.drops.flatMap((d) => d !== drop ? [d] : displaced ? [{ ...d, item: displaced }] : []);
    this.commit({ slots, selected: slot, drops });
    return { item: drop.item, displaced };
  }

  private clearHeld(drops = this.state.drops) {
    const slots = [...this.slots];
    slots[this.selected] = null;
    this.commit({ slots, drops });
  }

  private commit(patch: Partial<InventoryState>) {
    this.state = { ...this.state, ...patch };
    this.save(this.state);
    this.emit('change');
  }
}

export const inventory = new PlayerInventory(
  loadJSON(STORAGE_KEY, PlayerInventory.initial(), 'session'),
  (state) => saveJSON(STORAGE_KEY, state, 'session'),
);
