/* This example requires Tailwind CSS v2.0+ */
import React, { Fragment, useCallback, useState } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { BellIcon, MenuIcon, XIcon } from '@heroicons/react/outline';
import { useProfile } from '../profile-provider';
import { NavLink } from 'react-router-dom';
import { UserStatus } from '../../__generated__/globalTypes';
import { useStatus } from '../components/use-status';
import { Flow } from '../pages/flow';
import { Avatar } from '../components/avatar';
import { NotificationList } from '../components/notification-list';

const navigation = [
  { name: 'Dashboard', to: '/' },
  { name: 'Friends', to: '/friends' },
  { name: 'Tasks', to: '/tasks' },
];
const userNavigation = [
  { name: 'Your Profile', to: '/profile' },
  { name: 'Settings', to: '/settings' },
  { name: 'Sign out', href: '/auth/logout' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const Page: React.FC<{ title: string }> = ({ title, children }) => {
  const profile = useProfile();

  const { status, setStatus, loading, saving } = useStatus();

  if (status === UserStatus.FLOW) return <Flow />;

  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-100">
        <body class="h-full">
        ```
      */}
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-800">
          {({ open }) => (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-8 w-8"
                        src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
                        alt="Workflow"
                      />
                    </div>
                    <div className="hidden md:block">
                      <div className="ml-10 flex items-baseline space-x-4">
                        {navigation.map((item) => (
                          <NavLink
                            key={item.name}
                            to={item.to}
                            className={({ isActive }) =>
                              classNames(
                                isActive
                                  ? 'bg-gray-900 text-white'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                'px-3 py-2 rounded-md text-sm font-medium',
                              )
                            }
                          >
                            {item.name}
                          </NavLink>
                        ))}
                      </div>
                    </div>

                    <div className="relative z-0 inline-flex shadow-sm rounded-md ml-8">
                      <button
                        type="button"
                        onClick={() => setStatus(UserStatus.AWAY)}
                        // className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium focus:z-20 focus:outline-none focus:ring-1 ${
                          status === UserStatus.AWAY
                            ? 'text-gray-700 hover:bg-gray-50 bg-gray-200 focus:ring-gray-500 border-gray-500 z-10'
                            : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50 border-gray-300 bg-transparent focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                      >
                        Away
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(UserStatus.IDLE)}
                        className={`-ml-px relative inline-flex items-center px-4 py-2 border text-sm font-medium focus:z-20 focus:outline-none focus:ring-1 ${
                          status === UserStatus.IDLE
                            ? 'text-indigo-600 hover:bg-indigo-50 bg-indigo-200 focus:ring-indigo-500 border-indigo-500 z-10'
                            : 'text-gray-300 hover:text-gray-500 hover:bg-indigo-50 border-gray-300 bg-transparent focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                      >
                        Idle
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(UserStatus.FLOW)}
                        className={`-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium focus:z-20 focus:outline-none focus:ring-1 ${'text-gray-300 hover:text-gray-500 hover:bg-green-50 border-gray-300 bg-transparent focus:ring-indigo-500 focus:border-indigo-500'}`}
                      >
                        Flow
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      <button
                        type="button"
                        className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                      >
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </button>

                      {/* Profile dropdown */}
                      <Menu as="div" className="ml-3 relative">
                        <div>
                          <Menu.Button className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                            <span className="sr-only">Open user menu</span>
                            <Avatar
                              key={profile.id}
                              size="sm"
                              name={profile.name}
                              avatarUrl={profile.avatarUrl || undefined}
                              status={status}
                            />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {userNavigation.map((item) => (
                              <Menu.Item key={item.name}>
                                {item.to ? (
                                  <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                      classNames(
                                        isActive ? 'bg-gray-100' : '',
                                        'block px-4 py-2 text-sm text-gray-700',
                                      )
                                    }
                                  >
                                    {item.name}
                                  </NavLink>
                                ) : (
                                  <a
                                    href={item.href}
                                    className="block px-4 py-2 text-sm text-gray-700"
                                  >
                                    {item.name}
                                  </a>
                                )}
                              </Menu.Item>
                            ))}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <MenuIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'block px-3 py-2 rounded-md text-base font-medium',
                        )
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </div>
                <div className="pt-4 pb-3 border-t border-gray-700">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <Avatar
                        key={profile.id}
                        size="md"
                        name={profile.name}
                        avatarUrl={profile.avatarUrl || undefined}
                        status={status}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">
                        {profile.name}
                      </div>
                      <div className="text-sm font-medium leading-none text-gray-400">
                        {profile.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ml-auto bg-gray-800 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    {userNavigation.map((item) =>
                      item.to ? (
                        <NavLink
                          key={item.name}
                          to={item.to}
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          {item.name}
                        </NavLink>
                      ) : (
                        <Disclosure.Button
                          key={item.name}
                          as="a"
                          href={item.href}
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          {item.name}
                        </Disclosure.Button>
                      ),
                    )}
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        </header>
        <main>
          <NotificationList />
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};
