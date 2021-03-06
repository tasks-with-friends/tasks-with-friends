import { MessageBus } from './message-bus';

export class NullMessageBus implements MessageBus {
  onTaskStatusChanged() {
    return;
  }
  onUserStatusChanged() {
    return;
  }
  onUserCurrentTaskChanged(): void {
    return;
  }
  onAddedToTask(): void {
    return;
  }
  onRemovedFromTask(): void {
    return;
  }

  drain(): Promise<void> {
    return Promise.resolve();
  }
}
