// Traceability: settings-staff-management
// REQ 3.1 -> it('displays staff section when user role is owner')
// REQ 3.6 -> it('hides staff section when user role is staff')
// REQ 3.2 -> (covered by E2E and StaffManagement component)
// REQ 3.3, 3.4, 3.5, 3.7 -> (covered by E2E invite-remove-staff.spec.ts)
// PROP 4 -> it('staff section visible iff role is owner (PROP 4)')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaffSection } from "./StaffSection";

vi.mock("./StaffManagement", () => ({
  StaffManagement: ({
    propertyId,
    propertyName,
  }: {
    propertyId: string;
    propertyName: string;
  }) => (
    <div data-testid="staff-management">
      Staff for {propertyName} ({propertyId})
    </div>
  ),
}));

describe("StaffSection", () => {
  describe("good cases", () => {
    it("displays staff section when user role is owner", () => {
      render(
        <StaffSection
          propertyId="prop-1"
          propertyName="Test Property"
          userRole="owner"
        />
      );

      expect(
        screen.getByRole("heading", {
          name: /staff for|staff.*test property/i,
        })
      ).toBeInTheDocument();
      expect(screen.getByTestId("staff-management")).toBeInTheDocument();
    });

    it("section header shows property name", () => {
      render(
        <StaffSection
          propertyId="prop-2"
          propertyName="Sunset Villa"
          userRole="owner"
        />
      );

      expect(
        screen.getByRole("heading", {
          name: /staff for sunset villa|sunset villa/i,
        })
      ).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("hides staff section when user role is staff", () => {
      render(
        <StaffSection
          propertyId="prop-1"
          propertyName="Test Property"
          userRole="staff"
        />
      );

      expect(screen.queryByTestId("staff-management")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /staff for/i })
      ).not.toBeInTheDocument();
    });

    it("hides staff section when user role is null", () => {
      render(
        <StaffSection
          propertyId="prop-1"
          propertyName="Test Property"
          userRole={null}
        />
      );

      expect(screen.queryByTestId("staff-management")).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("staff section visible iff role is owner (PROP 4)", () => {
      const { rerender } = render(
        <StaffSection
          propertyId="p1"
          propertyName="P"
          userRole="owner"
        />
      );
      expect(screen.getByTestId("staff-management")).toBeInTheDocument();

      rerender(
        <StaffSection propertyId="p1" propertyName="P" userRole="staff" />
      );
      expect(screen.queryByTestId("staff-management")).not.toBeInTheDocument();

      rerender(
        <StaffSection propertyId="p1" propertyName="P" userRole="owner" />
      );
      expect(screen.getByTestId("staff-management")).toBeInTheDocument();
    });
  });
});
