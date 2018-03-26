/* eslint-env browser */
/* eslint-disable no-param-reassign, padded-blocks */
(() => {
  document.addEventListener('DOMContentLoaded', () => {

    /**
     * remove a class from all elements that match a given selector
     *
     * @param {string} selector - css selector
     * @param {string} clazz - the class to remove
     */
    const removeClassFrom = (selector, clazz) => {
      document
        .querySelectorAll(selector)
        .forEach((el_) => {
          el_.classList.remove(clazz);
        });
    };

    /**
     * add a class to element that matches a given selector
     *
     * @param {string} selector - css selector
     * @param {string} clazz - the class to add
     */
    const addClassTo = (selector, clazz) => {
      document.querySelector(selector).classList.add(clazz);
    };

    /**
     * show content of a specific contract
     *
     * @param {string} hash - hash part of the url, contains what needs to be shown
     */
    const showTab = (hash) => {

      const chosenContractSlug = hash.split('contract-tab-').pop();

      // hide all other tabs
      removeClassFrom('.contract-tab', 'show');

      // unselect all tab nav buttons
      removeClassFrom('.contract-nav-button', 'current');

      // select the chosen tab nav button
      // addClassTo(`[href='${hash}']`, 'current');
      addClassTo(`#contract-nav-button-${chosenContractSlug}`, 'current');

      // unhide the chosen tab
      addClassTo(hash, 'show');
    };

    /**
     * show content of a specific contract's chosen tab
     *
     * @param {string} hash - hash part of the url, contains what needs to be shown
     */
    const showTabContent = (hash) => {
      // get the tab this button belongs to
      // href example: contract-mycontract-output-oyente
      const tabOfThisButton = hash.split('contract-content-').pop().split('-output')[0];

      // make the tab visible
      showTab(`#contract-tab-${tabOfThisButton}`);

      // hide all content tabs of the chosen tab
      removeClassFrom(`#contract-tab-${tabOfThisButton} .contract-tab-content`, 'show');

      // unselect all content nav buttons of the chosen tab
      removeClassFrom(`#contract-tab-${tabOfThisButton} .contract-tab-nav-button`, 'current');

      // select the chosen content tab nav button
      addClassTo(`[href='${hash}']`, 'current');

      // unhide the chosen tab content
      addClassTo(hash, 'show');
    };

    const openContentTabIfNoneOpen = (contentTabId) => {
      const gotActiveContentTab = document.querySelector(`${contentTabId} .contract-tab-nav-button.current`);

      if (!gotActiveContentTab) {
        // open the flatten content tab
        window.location.replace(`${contentTabId.replace('tab', 'content')}-output-flatten`);
      }
    };

    /**
     * given a hash load the correct stuff in the ui
     *
     * @param {string} hash - hash part of url
     */
    const loadHash = (hash) => {
      const linkType = hash.split('-')[1];

      if (linkType === 'tab') {
        showTab(hash);

        openContentTabIfNoneOpen(hash);
      } else if (linkType === 'content') {
        showTabContent(hash);
      }
    };

    /**
     * extract the hash part from a url
     *
     * @param {string} url - url
     * @return {string} the hash part from the url
     */
    const extractHashVal = url => (
      `#${url.split('#').pop()}`
    );

    /**
     * given a selector attach a click event listener to all elements that match
     * the selector, extracting the hash part of the url of link that is clicked,
     * and "loading the hash"
     *
     * @param {string} selector - css selector
     */
    const listenClickExecHash = (selector) => {
      document
        .querySelectorAll(selector)
        .forEach((el) => {
          el.addEventListener('click', (ev) => {
            loadHash(extractHashVal(ev.target.href));
          });
        });
    };

    /**
     * listen for hash change, and when detected load the new hash
     * this is used to correctly handle pressing the browser Back button
     */
    const listenUrlHashChange = () => {
      window.onhashchange = () => {
        loadHash(extractHashVal(window.location.hash));
      };
    };

    const openFirstFileTab = () => {
      loadHash(extractHashVal(document.querySelector('.contract-nav-button a').href));
    };

    // load mythril iframe in new window! its too heavy for inpage
    // https://stackoverflow.com/a/34694908

    /** start listening to click events */
    listenClickExecHash('.contract-nav-button');
    listenClickExecHash('.contract-tab-nav-button');
    listenUrlHashChange();

    openFirstFileTab();
  });
})();
