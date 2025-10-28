"""Unified Kanban view for Build, Purchase, and Sales Orders"""

from plugin import InvenTreePlugin

from plugin.mixins import SettingsMixin, UserInterfaceMixin

from . import PLUGIN_VERSION


class WorkOrderKanban(SettingsMixin, UserInterfaceMixin, InvenTreePlugin):
    """WorkOrderKanban - custom InvenTree plugin."""

    # Plugin metadata
    TITLE = "Work Order Kanban"
    NAME = "WorkOrderKanban"
    SLUG = "work-order-kanban"
    DESCRIPTION = "Unified Kanban view for Build, Purchase, and Sales Orders"
    VERSION = PLUGIN_VERSION

    # Additional project information
    AUTHOR = "EQUA AI"

    LICENSE = "MIT"

    # Optionally specify supported InvenTree versions
    # MIN_VERSION = '0.18.0'
    # MAX_VERSION = '2.0.0'

    # Disable admin settings UI for now (Settings.js has errors)
    # ADMIN_SOURCE = "Settings.js:renderPluginSettings"

    # Plugin settings (from SettingsMixin)
    # Ref: https://docs.inventree.org/en/latest/plugins/mixins/settings/
    SETTINGS = {
        # Define your plugin settings here...
        "CUSTOM_VALUE": {
            "name": "Custom Value",
            "description": "A custom value",
            "validator": int,
            "default": 42,
        }
    }

    # User interface elements (from UserInterfaceMixin)
    # Ref: https://docs.inventree.org/en/latest/plugins/mixins/ui/

    # Custom UI panels
    def get_ui_panels(self, request, context: dict, **kwargs):
        """Return a list of custom panels to be rendered in the InvenTree user interface."""

        panels = []

        # Display panel as a standalone page (not tied to a specific model)
        panels.append({
            "key": "work-order-kanban-panel",
            "title": "Work Order Kanban",
            "description": "Unified Kanban view for Build, Purchase, and Sales Orders",
            "icon": "ti:layout-kanban",
            "source": self.plugin_static_file("Panel.js:renderWorkOrderKanbanPanel"),
            "context": {
                # Provide additional context data to the panel
                "settings": self.get_settings_dict(),
            },
        })

        return panels

    # Navigation tab in top menu (uses UserInterfaceMixin method)
    def get_ui_navigation_items(self, request, context: dict, **kwargs):
        """Add a navigation tab to the top menu bar that opens the Kanban panel."""

        return [
            {
                "key": "kanban-page",
                "title": "Kanban",
                "icon": "ti:layout-kanban",
                "options": {
                    # Link to the panel using the panel feature type
                    "url": "/platform/plugin:work-order-kanban-panel",
                },
            }
        ]

    # Custom dashboard items
    def get_ui_dashboard_items(self, request, context: dict, **kwargs):
        """Return a list of custom dashboard items to be rendered in the InvenTree user interface."""

        # Example: only display for 'staff' users
        if not request.user or not request.user.is_staff:
            return []

        items = []

        items.append({
            "key": "work-order-kanban-dashboard",
            "title": "Work Order Kanban Dashboard Item",
            "description": "Custom dashboard item",
            "icon": "ti:dashboard:outline",
            "source": self.plugin_static_file(
                "Dashboard.js:renderWorkOrderKanbanDashboardItem"
            ),
            "context": {
                # Provide additional context data to the dashboard item
                "settings": self.get_settings_dict(),
                "bar": "foo",
            },
        })

        return items
