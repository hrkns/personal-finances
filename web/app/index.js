const appDom = createAppDom(document);
const appState = createAppState();
const apiRequest = createApiRequest(frontendUtils.parseApiResponse);

const appModules = createAppModules({
  dom: appDom,
  state: appState,
  apiRequest,
  frontendUtils,
});

const appRouting = createAppRouting({
  tabButtonElements: appDom.tabButtonElements,
  settingsTabButtonElements: appDom.settingsTabButtonElements,
  creditCardTabButtonElements: appDom.creditCardTabButtonElements,
  settingsSelectionMessageElement: appDom.settingsSelectionMessageElement,
  views: appDom.views,
  settingsViews: appDom.settingsViews,
  creditCardViews: appDom.creditCardViews,
  frontendRouter,
});

init();

async function init() {
  await appModules.banksModule.loadCountryOptions();

  const initialRoute = frontendRouter.ensureValidRoute();
  appRouting.applyRoute(initialRoute);

  frontendRouter.onRouteChange(appRouting.applyRoute);
  appRouting.bindTabNavigation();

  await Promise.all([
    appModules.transactionCategoriesModule.load(),
    appModules.transactionsModule.load(),
    appModules.peopleModule.load(),
    appModules.currenciesModule.load(),
    appModules.banksModule.load(),
    appModules.bankAccountsModule.load(),
  ]);

  await appModules.creditCardsModule.load();
  await appModules.creditCardInstallmentsModule.load();
  await appModules.creditCardCyclesModule.load();

  appDom.transactionCategories.formElement.addEventListener("submit", appModules.transactionCategoriesModule.onSubmit);
  appDom.transactionCategories.cancelButtonElement.addEventListener(
    "click",
    appModules.transactionCategoriesModule.resetForm
  );

  appDom.transactions.formElement.addEventListener("submit", appModules.transactionsModule.onSubmit);
  appDom.transactions.cancelButtonElement.addEventListener("click", appModules.transactionsModule.resetForm);

  appDom.people.formElement.addEventListener("submit", appModules.peopleModule.onSubmit);
  appDom.people.cancelButtonElement.addEventListener("click", appModules.peopleModule.resetForm);

  appDom.currency.formElement.addEventListener("submit", appModules.currenciesModule.onSubmit);
  appDom.currency.cancelButtonElement.addEventListener("click", appModules.currenciesModule.resetForm);

  appDom.bank.formElement.addEventListener("submit", appModules.banksModule.onSubmit);
  appDom.bank.cancelButtonElement.addEventListener("click", appModules.banksModule.resetForm);

  appDom.bankAccounts.formElement.addEventListener("submit", appModules.bankAccountsModule.onSubmit);
  appDom.bankAccounts.cancelButtonElement.addEventListener("click", appModules.bankAccountsModule.resetForm);

  appDom.creditCards.formElement.addEventListener("submit", appModules.creditCardsModule.onSubmit);
  appDom.creditCards.cancelButtonElement.addEventListener("click", appModules.creditCardsModule.resetForm);

  appDom.creditCardInstallments.formElement.addEventListener("submit", appModules.creditCardInstallmentsModule.onSubmit);
  appDom.creditCardInstallments.cancelButtonElement.addEventListener("click", appModules.creditCardInstallmentsModule.resetForm);

  appDom.creditCardCycles.formElement.addEventListener("submit", appModules.creditCardCyclesModule.onSubmit);
  appDom.creditCardCycles.cancelButtonElement.addEventListener("click", appModules.creditCardCyclesModule.resetForm);

  appDom.creditCardCycleBalances.formElement.addEventListener("submit", appModules.creditCardCyclesModule.onBalanceSubmit);
  appDom.creditCardCycleBalances.cancelButtonElement.addEventListener("click", appModules.creditCardCyclesModule.resetBalanceForm);
}
