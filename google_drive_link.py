import sys
from googleapiclient.discovery import build
from google.oauth2 import service_account


def get_google_drive_files(folder_id, category_name):
    """Get files from a specific Google Drive folder"""
    # Set up credentials (you'll need a service account key file)
    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
    SERVICE_ACCOUNT_FILE = './math-problems-468009-6fcc2aee7b59.json'
    
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    
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

# usage:
past_problems_juni_id= "1kwIwb28AJo2-MhuE9V4pzcDxwXimIUxr"
eju_folder_id = "1ZJ6zQFpYhtKarExGgMN4nyWH2UTT7cvl"
google_links_of_eju = get_google_drive_files(eju_folder_id, "EJU Past Problems")
google_links_of_past_problems_juni = get_google_drive_files(past_problems_juni_id, "Past Problems of J-Universites")

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
print(categorized_links['EJU Past Problems']) 
# category= list(categorized_links.keys())
# print(type(list(category)))
# lists_of_link_dic=categorized_links[category[0]]
# print(lists_of_link_dic)