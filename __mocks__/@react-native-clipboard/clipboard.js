// Manual mock for @react-native-clipboard/clipboard
const Clipboard = {
  getString: jest.fn(() => Promise.resolve('')),
  setString: jest.fn(),
  hasString: jest.fn(() => Promise.resolve(false)),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};

export default Clipboard;
