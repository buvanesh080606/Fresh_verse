import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freshverse.settings')
django.setup()

from core.models import BusRoute

# Clear existing bus routes first so we start clean
BusRoute.objects.all().delete()

routes_data = [
    {"route_no": "1", "source": "Devi Theatre", "destination": "Campus", "blocks_served": "RV Block, KS Block", "timings_json": [{"stop": "Vee Stop", "time": "07:30 AM"}, {"stop": "Renga", "time": "07:45 AM"}, {"stop": "Kovil", "time": "08:00 AM"}, {"stop": "Devi", "time": "08:15 AM"}]},
    {"route_no": "2", "source": "Teppakulam", "destination": "Campus", "blocks_served": "BD Block, Mech Block", "timings_json": [{"stop": "Teppa", "time": "07:35 AM"}, {"stop": "TVK", "time": "07:50 AM"}, {"stop": "Venk", "time": "08:05 AM"}, {"stop": "No1", "time": "08:20 AM"}]},
    {"route_no": "3", "source": "Anna Statue", "destination": "Campus", "blocks_served": "MBA Block, RV Block", "timings_json": [{"stop": "Anna", "time": "07:40 AM"}, {"stop": "Ibrahim", "time": "07:55 AM"}, {"stop": "Mela", "time": "08:15 AM"}]},
    {"route_no": "4", "source": "Laxman Stop", "destination": "Campus", "blocks_served": "Mech Block, BD Block", "timings_json": [{"stop": "Lax", "time": "07:20 AM"}, {"stop": "Thillai", "time": "07:35 AM"}, {"stop": "GH", "time": "07:50 AM"}, {"stop": "CO", "time": "08:00 AM"}, {"stop": "AM", "time": "08:10 AM"}, {"stop": "Kal", "time": "08:20 AM"}, {"stop": "Man", "time": "08:30 AM"}]},
    {"route_no": "5", "source": "Woraiur", "destination": "Campus", "blocks_served": "KS Block, MBA Block", "timings_json": [{"stop": "Woraiur", "time": "07:45 AM"}, {"stop": "Salai Road", "time": "08:05 AM"}]},
    {"route_no": "6", "source": "Somarasampettai", "destination": "Campus", "blocks_served": "RV Block", "timings_json": [{"stop": "Somarasam", "time": "07:30 AM"}, {"stop": "U T Malai", "time": "08:00 AM"}]},
    {"route_no": "7", "source": "Dheeran Nagar", "destination": "Campus", "blocks_served": "KS Block, BD Block", "timings_json": [{"stop": "Dheeran Nagar Main", "time": "07:50 AM"}, {"stop": "Bypass", "time": "08:10 AM"}]},
    {"route_no": "8", "source": "HAPP", "destination": "Campus", "blocks_served": "Mech Block, MBA Block", "timings_json": [{"stop": "HAPP Gate", "time": "07:30 AM"}, {"stop": "Airport", "time": "08:00 AM"}, {"stop": "Udayan", "time": "08:15 AM"}]},
    {"route_no": "9", "source": "RPF", "destination": "Campus", "blocks_served": "RV Block, KS Block", "timings_json": [{"stop": "RPF Gate", "time": "07:40 AM"}, {"stop": "J K", "time": "07:55 AM"}, {"stop": "K K Nagar", "time": "08:15 AM"}]},
    {"route_no": "10", "source": "M K Store", "destination": "Campus", "blocks_served": "BD Block, Mech Block", "timings_json": [{"stop": "M K", "time": "07:50 AM"}, {"stop": "TVS Tolgate", "time": "08:10 AM"}]},
    {"route_no": "11", "source": "Manapparai", "destination": "Campus", "blocks_served": "MBA Block, RV Block", "timings_json": [{"stop": "Manapparai Full Route", "time": "07:15 AM"}, {"stop": "Highway Stop", "time": "07:45 AM"}]},
    {"route_no": "12", "source": "Thanjavur", "destination": "Campus", "blocks_served": "KS Block, BD Block", "timings_json": [{"stop": "Thanjavur Old Bus Stand", "time": "07:00 AM"}, {"stop": "New Bus Stand", "time": "07:20 AM"}]},
    {"route_no": "13", "source": "Thuvakudi", "destination": "Campus", "blocks_served": "Mech Block, MBA Block", "timings_json": [{"stop": "TNJ Area", "time": "07:15 AM"}, {"stop": "Thuva", "time": "07:45 AM"}, {"stop": "Thiru", "time": "08:10 AM"}]},
    {"route_no": "14", "source": "Dheeran Nagar", "destination": "Campus", "blocks_served": "RV Block, KS Block", "timings_json": [{"stop": "D.Nagar", "time": "07:40 AM"}, {"stop": "Kattur", "time": "08:10 AM"}]},
    {"route_no": "15", "source": "Oil Mill", "destination": "Campus", "blocks_served": "BD Block, Mech Block", "timings_json": [{"stop": "Oil Mill", "time": "07:45 AM"}, {"stop": "SIT", "time": "08:00 AM"}, {"stop": "Pal", "time": "08:15 AM"}, {"stop": "Senthamangalam", "time": "08:30 AM"}]},
    {"route_no": "16", "source": "Girls Hostel Block A", "destination": "Campus Labs", "blocks_served": "KS Block, MBA Block", "timings_json": [{"stop": "Hostel A", "time": "08:15 AM"}, {"stop": "Mess Hall", "time": "08:25 AM"}]},
    {"route_no": "17", "source": "Girls Hostel Block B", "destination": "Campus Labs", "blocks_served": "RV Block, BD Block", "timings_json": [{"stop": "Hostel B", "time": "08:15 AM"}, {"stop": "Mess Hall", "time": "08:25 AM"}]},
    {"route_no": "18", "source": "Boys Hostel Block C", "destination": "Campus Labs", "blocks_served": "Mech Block, KS Block", "timings_json": [{"stop": "Hostel C", "time": "08:15 AM"}, {"stop": "Main Arch", "time": "08:25 AM"}]},
    {"route_no": "19", "source": "IG Statue", "destination": "Campus", "blocks_served": "BD Block, Mech Block", "timings_json": [{"stop": "IG Stop", "time": "07:55 AM"}]},
    {"route_no": "20", "source": "Geetha Nagar", "destination": "Campus", "blocks_served": "MBA Block, RV Block", "timings_json": [{"stop": "Geetha", "time": "07:45 AM"}, {"stop": "Bishop Stop", "time": "08:10 AM"}]},
    {"route_no": "21", "source": "Collector Office", "destination": "Campus", "blocks_served": "KS Block, BD Block", "timings_json": [{"stop": "Collector Office", "time": "07:40 AM"}, {"stop": "E.Pudhur", "time": "08:05 AM"}]},
    {"route_no": "22", "source": "Boys Hostel Block D", "destination": "Campus Labs", "blocks_served": "Mech Block, MBA Block", "timings_json": [{"stop": "Hostel D", "time": "08:15 AM"}, {"stop": "Playground", "time": "08:25 AM"}]},
    {"route_no": "23", "source": "Trichy Town", "destination": "Campus", "blocks_served": "MBA Block, BD Block", "timings_json": [{"stop": "Town Hall", "time": "07:30 AM"}, {"stop": "Main Road", "time": "08:00 AM"}]},
    {"route_no": "24", "source": "Kottapattu", "destination": "Campus", "blocks_served": "RV Block, Mech Block", "timings_json": [{"stop": "Kottapattu Nil", "time": "08:00 AM"}]}
]

for item in routes_data:
    BusRoute.objects.create(
        route_no=item["route_no"],
        source=item["source"],
        destination=item["destination"],
        blocks_served=item["blocks_served"],
        timings_json=item["timings_json"]
    )

print("Successfully seeded 24 campus bus routes!")
