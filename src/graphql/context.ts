import { Profile } from '../types';
import { registry } from '../registry';

export type Context = { profile: Profile; registry: typeof registry };
export type Info = {};
