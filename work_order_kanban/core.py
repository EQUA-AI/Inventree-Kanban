"""Unified Kanban view for Build, Purchase, and Sales Orders"""

from plugin import InvenTreePlugin

from plugin.mixins import NavigationMixin, SettingsMixin, UrlsMixin, UserInterfaceMixin

from . import PLUGIN_VERSION


class WorkOrderKanban(
    SettingsMixin, UrlsMixin, NavigationMixin, UserInterfaceMixin, InvenTreePlugin
):
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

    # NavigationMixin configuration
    # Creates a navigation tab in the top menu bar
    NAVIGATION_TAB_NAME = "Kanban"
    NAVIGATION_TAB_ICON = "ti:layout-kanban"

    # Navigation links - uses Django URL pattern names
    # Format: plugin:<plugin-slug>:<url-name>
    NAVIGATION = [
        {
            "name": "Kanban Board",
            "link": "plugin:work-order-kanban:kanban-board",
            "icon": "ti:layout-kanban",
        }
    ]

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

    # URL routing (from UrlsMixin)
    # Ref: https://docs.inventree.org/en/stable/plugins/mixins/urls/
    def setup_urls(self):
        """Setup URL endpoints for this plugin.

        The URLs will be accessible at /plugin/work-order-kanban/<path>
        We serve a simple HTML page that loads the React Kanban component.
        """
        from django.http import HttpResponse
        from django.urls import path

        def kanban_page(request):
            """Serve a minimal HTML page that loads the React Kanban component."""
            html = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Work Order Kanban</title>
                <style>
                    body {{
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }}
                    #kanban-root {{
                        width: 100%;
                        height: 100vh;
                    }}
                </style>
            </head>
            <body>
                <div id="kanban-root"></div>
                <script type="module">
                    // Load the Kanban React component
                    import {{ renderWorkOrderKanbanPanel }} from '{self.plugin_static_file("Panel.js")}';
                    
                    // Render the Kanban board
                    const root = document.getElementById('kanban-root');
                    if (root && renderWorkOrderKanbanPanel) {{
                        renderWorkOrderKanbanPanel(root, {{
                            user: {{
                                username: "{request.user.username}",
                                is_staff: {str(request.user.is_staff).lower()},
                                is_superuser: {str(request.user.is_superuser).lower()}
                            }},
                            settings: {self.get_settings_dict()},
                            pluginSlug: "{self.slug}"
                        }});
                    }} else {{
                        root.innerHTML = '<div style="padding: 20px; color: red;">Error: Could not load Kanban component</div>';
                    }}
                </script>
            </body>
            </html>
            """
            return HttpResponse(html, content_type="text/html")

        return [
            # Main Kanban board page
            path("", kanban_page, name="kanban-board"),
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
