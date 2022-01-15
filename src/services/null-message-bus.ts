import { MessageBus } from './message-bus';

export class NullMessageBus implements MessageBus {
  onTaskStatusChanged() {
    return;
  }
  onUserStatusChanged() {
    return;
  }

  drain(): Promise<void> {
    return Promise.resolve();
  }
}
