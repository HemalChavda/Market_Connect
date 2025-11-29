import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BecomeSellerPage from "../BecomeSellerPage";
import { AuthProvider } from "../../contexts/AuthContext";
import * as userService from "../../../services/user";

vi.mock("../../../services/user");

const mockNavigate = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUserBuyer = {
  id: "123",
  name: "Test User",
  email: "test@test.com",
  role: "buyer",
};

const mockUserSeller = {
  id: "222",
  name: "Already Seller",
  email: "seller@test.com",
  role: "seller",
};

const mockUseAuth = vi.fn();

vi.mock("../../contexts/AuthContext", async () => {
  const actual = await vi.importActual("../../contexts/AuthContext");
  return { ...actual, useAuth: () => mockUseAuth() };
});

const renderPage = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <BecomeSellerPage />
      </AuthProvider>
    </BrowserRouter>
  );

describe("BecomeSellerPage — 100% Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUserBuyer,
      updateUser: mockUpdateUser,
      isAuthenticated: true,
    });
  });

  // FIXED: RENDER TEST WITHOUT DUPLICATE TEXT ERROR
  it("renders Become Seller page", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: /Become a Seller/i })
    ).toBeInTheDocument();
  });

  it("covers already-seller branch & back button", () => {
    mockUseAuth.mockReturnValueOnce({
      user: mockUserSeller,
      updateUser: mockUpdateUser,
      isAuthenticated: true,
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Back to Dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows validation errors when submitting empty form", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Become a Seller/i }));

    expect(await screen.findByText(/Shop name is required/i)).toBeInTheDocument();
  });

  it("shows pincode error if not 6 digits", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Shop Name/), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText(/Street Address/), { target: { value: "Y" } });
    fireEvent.change(screen.getByLabelText(/^City/), { target: { value: "Z" } });
    fireEvent.change(screen.getByLabelText(/^State/), { target: { value: "MH" } });
    fireEvent.change(screen.getByLabelText(/^Pincode/), { target: { value: "12" } });

    fireEvent.click(screen.getByRole("button", { name: /Become a Seller/i }));

    expect(await screen.findByText(/Pincode must be exactly 6 digits/i)).toBeInTheDocument();
  });

  it("submits successfully", async () => {
    userService.upgradeToSeller.mockResolvedValue({
      user: { id: "101", role: "seller" },
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/Shop Name/), { target: { value: "My Shop" } });
    fireEvent.change(screen.getByLabelText(/Street Address/), { target: { value: "Road" } });
    fireEvent.change(screen.getByLabelText(/^City/), { target: { value: "Mumbai" } });
    fireEvent.change(screen.getByLabelText(/^State/), { target: { value: "MH" } });
    fireEvent.change(screen.getByLabelText(/^Pincode/), { target: { value: "400001" } });

    global.alert = vi.fn();

    fireEvent.click(screen.getByRole("button", { name: /Become a Seller/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows server message when upgrade returns message", async () => {
    userService.upgradeToSeller.mockResolvedValue({ message: "Failed to upgrade" });

    renderPage();

    fireEvent.change(screen.getByLabelText(/Shop Name/), { target: { value: "My Shop" } });
    fireEvent.change(screen.getByLabelText(/Street Address/), { target: { value: "Road" } });
    fireEvent.change(screen.getByLabelText(/^City/), { target: { value: "Mumbai" } });
    fireEvent.change(screen.getByLabelText(/^State/), { target: { value: "MH" } });
    fireEvent.change(screen.getByLabelText(/^Pincode/), { target: { value: "400001" } });

    fireEvent.click(screen.getByRole("button", { name: /Become a Seller/i }));

    expect(await screen.findByText(/Failed to upgrade/i)).toBeInTheDocument();
  });

  it("handles thrown server error", async () => {
    userService.upgradeToSeller.mockRejectedValue({
      response: { data: { message: "Server exploded" } },
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/Shop Name/), { target: { value: "Shop" } });
    fireEvent.change(screen.getByLabelText(/Street Address/), { target: { value: "Road" } });
    fireEvent.change(screen.getByLabelText(/^City/), { target: { value: "Mumbai" } });
    fireEvent.change(screen.getByLabelText(/^State/), { target: { value: "MH" } });
    fireEvent.change(screen.getByLabelText(/^Pincode/), { target: { value: "400001" } });

    fireEvent.click(screen.getByRole("button", { name: /Become a Seller/i }));

    expect(await screen.findByText(/Server exploded/i)).toBeInTheDocument();
  });

  it("clicks both back & cancel buttons", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Back to Dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");

    mockNavigate.mockClear();

    const cancelBtn = screen.getAllByRole("button", { name: /^Cancel$/i })[0];
    fireEvent.click(cancelBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("clears nested address errors when typing again", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Become a Seller/i }));
    expect(await screen.findByText(/Street address is required/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Street Address *"), {
      target: { value: "New Street" },
    });

    expect(screen.queryByText(/Street address is required/i)).toBeNull();
  });

  it("clears shopName error when typing again", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Become a Seller/i }));
    expect(await screen.findByText(/Shop name is required/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Shop Name *"), {
      target: { value: "ABC Store" },
    });

    expect(screen.queryByText(/Shop name is required/i)).toBeNull();
  });

  it("updates country input (line 263)", () => {
    renderPage();

    const country = screen.getByLabelText("Country");
    fireEvent.change(country, { target: { value: "USA" } });

    expect(country.value).toBe("USA");
  });
});
