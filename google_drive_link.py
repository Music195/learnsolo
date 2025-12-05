import sys, os, json
from googleapiclient.discovery import build
from google.oauth2 import service_account


def get_google_drive_files(folder_id, category_name):
    """Get files from a specific Google Drive folder"""
    # Set up credentials (you'll need a service account key file)
    # Option for deployment
    try:
        if 'GOOGLE_CREDENTIALS_JSON' in os.environ:
            # Get credentials from environment variable
            credentials_info = json.loads(os.environ['GOOGLE_CREDENTIALS_JSON'])
            credentials = service_account.Credentials.from_service_account_info(
            credentials_info, scopes=['https://www.googleapis.com/auth/drive.readonly'])
        else:
            # Fallback for local development
            SERVICE_ACCOUNT_FILE = './math-problems-468009-2dfd02b27bfc.json'
            if os.path.exists(SERVICE_ACCOUNT_FILE):
                credentials = service_account.Credentials.from_service_account_file(
                    SERVICE_ACCOUNT_FILE, scopes=['https://www.googleapis.com/auth/drive.readonly'])
            else:
                # Return dummy data if no credentials are available
                print("WARNING: No credentials found. Returning dummy data.")
                return {
                    'category': category_name,
                    'files': [{'name': 'Example File (No credentials)', 'link_id': 'dummy_id'}]
                }
        # Build the Drive service
        service = build('drive', 'v3', credentials=credentials)
        
        # Query files in the folder
        query = f"'{folder_id}' in parents and trashed=false"
        results = service.files().list(
            q=query,
            fields="files(id, name)"
        ).execute()
        
        # Format results to match your structure
        files = results.get('files', [])
        file_list = [{'name': file['name'], 'link_id': file['id']} for file in files]
        
        return {
            'category': category_name,
            'files': file_list
        }
    except Exception as e:
        print(f"Error accessing Google Drive: {e}")
        # Return dummy data in case of any error
        return {
            'category': category_name,
            'files': [{'name': f'Error: {str(e)}', 'link_id': 'error'}]
        }

# usage:
past_problems_juni_id= "1kwIwb28AJo2-MhuE9V4pzcDxwXimIUxr"
eju_folder_id = "1ZJ6zQFpYhtKarExGgMN4nyWH2UTT7cvl"
google_links_of_eju = get_google_drive_files(eju_folder_id, "EJU Past Question")
google_links_of_past_problems_juni = get_google_drive_files(past_problems_juni_id, "Past Questions of J-Universites")

# Automatically collect all lists with a certain naming pattern
def collect_link_lists():
    current_module = sys.modules[__name__]
    link_lists = []
    link_dict = {}
    
    # Find all variables that start with 'google_links_of_'
    for var_name in dir(current_module):
        if var_name.startswith('google_links_of_'):
            var_value = getattr(current_module, var_name)
            if isinstance(var_value, dict) and 'category' in var_value:
                link_lists.append(var_value)
                # Use the category directly from the dictionary
                category = var_value['category']
                link_dict[category] = var_value
    return link_lists, link_dict

# Usage
all_link_lists, categorized_links = collect_link_lists()

# print(dir(sys.modules[__name__]))
# print(all_link_lists)
# print()
# print(categorized_links['EJU Past Problems']) 
# category= list(categorized_links.keys())
# print(type(list(category)))
# lists_of_link_dic=categorized_links[category[0]]
# print(lists_of_link_dic)