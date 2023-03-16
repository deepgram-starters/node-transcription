import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { SiGithub } from "@icons-pack/react-simple-icons";

import dgLogo from "../assets/deepgram.svg";

export default function NavBar() {
  return (
    <Disclosure as="nav" className="bg-almostBlack">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="block h-8 w-auto lg:hidden"
                    src={dgLogo}
                    alt="React logo"
                  />
                  <img
                    className="hidden h-8 w-auto lg:block"
                    src={dgLogo}
                    alt="React logo"
                  />
                </div>
                <div className="hidden sm:ml-6 sm:block w-full">
                  <div className="flex justify-end space-x-4">
                    <a
                      href="https://github.com/deepgram-starters/deepgram-javascript-starters/tree/main/Starter-01"
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                    >
                      <SiGithub className="inline h-[1.2rem] w-[1.2rem] -mt-[0.25rem] mr-[0.5rem] stroke-2" />{" "}
                      View the code on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              <Disclosure.Button
                as="a"
                href="https://github.com/deepgram-starters/deepgram-javascript-starters/tree/main/Starter-01"
                target="_blank"
                rel="noreferrer"
                className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
              >
                <SiGithub className="inline h-[1.2rem] w-[1.2rem] -mt-[0.25rem] mr-[0.5rem] stroke-2" />{" "}
                View the code on GitHub
              </Disclosure.Button>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
