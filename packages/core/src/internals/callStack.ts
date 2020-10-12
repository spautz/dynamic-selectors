import { DynamicSelectorResultEntry } from './resultCache';

/**
 * The CallStack tracks Results which aren't yet finished: when any Dynamic Selector is run, its (pending) Result
 * record is pushed onto this stack.
 *
 * It's then used to accumulate StateDependencies and CallDependencies dependencies while the selector is running.
 * This is how the *other* selectors that our selector calls access the CallDependencies list and add themselves to it.
 * A boolean value tells the other selector that it's only running as a check (and not as a 'real' dependency within
 * the selector body): its true/false value indicates whether or not it's allowed to execute as part of that check.
 *
 * This single instance is used forever across all selectors.
 */
const callStack: Array<DynamicSelectorResultEntry | boolean> = [];

const isFullEntry = (
  entryOrBool: DynamicSelectorResultEntry | boolean,
): entryOrBool is DynamicSelectorResultEntry => entryOrBool !== !!entryOrBool;

const getTopCallStackEntry = () => callStack[callStack.length - 1];
const getTopCallStackEntryWithState = (): DynamicSelectorResultEntry | undefined => {
  let index = callStack.length - 1;
  while (index >= 0 && !isFullEntry(callStack[index])) {
    index--;
  }
  return callStack[index] as DynamicSelectorResultEntry;
};
const pushCallStackEntry = callStack.push.bind(callStack);
const popCallStackEntry = callStack.pop.bind(callStack);

export {
  isFullEntry,
  getTopCallStackEntry,
  getTopCallStackEntryWithState,
  pushCallStackEntry,
  popCallStackEntry,
};
