/* This example requires Tailwind CSS v2.0+ */
import React, { Fragment, useCallback, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { SpeakerphoneIcon } from '@heroicons/react/outline';
import { ModalPropTypes } from './types';
import { useTask } from './use-task';
import { useJoinTask } from './use-join-task';
import { useStatus } from './use-status';
import { UserStatus } from '../../__generated__/globalTypes';
import { useNotifications } from './notification-provider';

export const useTaskAlertModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalTaskId, setTaskId] = useState<string | undefined>();
  const open = useCallback((taskId: string) => {
    setTaskId(taskId);
    setIsOpen(true);
  }, []);

  const Modal: React.VFC = useCallback(
    () => (
      <TaskAlertModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        taskId={internalTaskId}
      />
    ),
    [isOpen, internalTaskId],
  );

  return { Modal, open };
};

export interface TaskAlertModalPropTypes extends ModalPropTypes {
  taskId: string | undefined;
}

const TaskAlertModal: React.VFC<TaskAlertModalPropTypes & ModalPropTypes> = ({
  taskId,
  isOpen,
  setIsOpen,
}) => {
  const { clearTask } = useNotifications();
  const { currentTaskId, status, loading: loadingStatus } = useStatus();
  const joinButtonRef = useRef(null);
  const { data } = useTask(taskId);

  const task = data?.task;

  const [joinTask] = useJoinTask(task?.id);

  const handleJoinTask = useCallback(() => {
    setIsOpen(false);
    clearTask(task?.id);
    joinTask();
  }, [joinTask, setIsOpen, clearTask, task?.id]);

  const show =
    isOpen &&
    !!task &&
    task.id !== currentTaskId &&
    status !== UserStatus.FLOW &&
    !loadingStatus;

  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={joinButtonRef}
        onClose={setIsOpen}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <SpeakerphoneIcon
                    className="h-6 w-6 text-green-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900"
                  >
                    A task just started!
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Do you want to join the task{' '}
                      <span className="text-indigo-600 font-bold">
                        {task?.name}
                      </span>
                      ? Joining now will help you and your friends stay
                      productive.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  onClick={handleJoinTask}
                  ref={joinButtonRef}
                >
                  Join task
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Not now
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
