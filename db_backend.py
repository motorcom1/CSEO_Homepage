from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import psycopg2
import os
import csv

app = Flask(__name__)
# Enable CORS for communication with local frontend
CORS(app)

DB_CONFIG = {
    "dbname": "SCADA_db",
    "user": "postgres",
    "password": "123400",
    "host": "localhost",
    "port": "5432"
}

MEMBER_DB_CONFIG = {
    "dbname": "CSEO_Group_db",
    "user": "postgres",
    "password": "123400",
    "host": "localhost",
    "port": "5432"
}

CHILLER_DB_CONFIG = {
    "dbname": "chiller_db",
    "user": "postgres",
    "password": "123400",
    "host": "localhost",
    "port": "5432"
}

def initialize_member_db():
    # 1. Connect to default 'postgres' database to check and create CSEO_Group_db
    admin_conn = None
    try:
        admin_conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="123400",
            host="localhost",
            port="5432"
        )
        admin_conn.autocommit = True
        with admin_conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = 'CSEO_Group_db'")
            exists = cur.fetchone()
            if not exists:
                cur.execute('CREATE DATABASE "CSEO_Group_db"')
                print("Database CSEO_Group_db created successfully.")
            else:
                print("Database CSEO_Group_db already exists.")
    except Exception as e:
        print(f"Error checking/creating database: {str(e)}")
    finally:
        if admin_conn:
            admin_conn.close()

    # 2. Connect to CSEO_Group_db to create schema, table, and populate data
    conn = None
    try:
        conn = psycopg2.connect(**MEMBER_DB_CONFIG)
        conn.autocommit = True
        with conn.cursor() as cur:
            # Create schema CSEO_member_data
            cur.execute('CREATE SCHEMA IF NOT EXISTS "CSEO_member_data"')
            
            # Create table CSEO_member_data_table
            create_table_query = """
            CREATE TABLE IF NOT EXISTS "CSEO_member_data"."CSEO_member_data_table" (
                name VARCHAR(100),
                id VARCHAR(100) PRIMARY KEY,
                job_title VARCHAR(100),
                position VARCHAR(100),
                "e-mail" VARCHAR(255),
                phone_number VARCHAR(100),
                division VARCHAR(100),
                department VARCHAR(100),
                job VARCHAR(100)
            );
            """
            cur.execute(create_table_query)

            # Create config table for admin credentials
            create_config_query = """
            CREATE TABLE IF NOT EXISTS "CSEO_member_data"."admin_config" (
                key VARCHAR(100) PRIMARY KEY,
                value VARCHAR(255)
            );
            """
            cur.execute(create_config_query)
            
            # Insert default password if not already present
            cur.execute(
                """
                INSERT INTO "CSEO_member_data"."admin_config" (key, value)
                VALUES ('admin_password', '1234')
                ON CONFLICT (key) DO NOTHING
                """
            )
            print("Initialized admin config table with default password.")
            
            # Truncate and reload CSV data to ensure database stays in sync with user edits
            cur.execute('TRUNCATE TABLE "CSEO_member_data"."CSEO_member_data_table"')
            print("Truncated CSEO_member_data_table for clean CSV import.")
            
            csv_path = r"c:\Users\zed04\OneDrive\Dokumen\CSEO Data Management System\CSEO_member_dummy.csv"
            if os.path.exists(csv_path):
                with open(csv_path, 'r', encoding='utf-8-sig') as f:
                    reader = csv.reader(f)
                    header = next(reader)
                    header = [h.strip() for h in header]
                    
                    for row in reader:
                        row = [val.strip() for val in row]
                        if len(row) < 9:
                            continue
                        cur.execute(
                            """
                            INSERT INTO "CSEO_member_data"."CSEO_member_data_table"
                            (name, id, job_title, position, "e-mail", phone_number, division, department, job)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (id) DO NOTHING
                            """,
                            row[:9]
                        )
                print("Successfully imported CSV records into CSEO_member_data_table.")
            else:
                print(f"Warning: CSV file not found at {csv_path}")
                
    except Exception as e:
        print(f"Error initializing database table: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.route('/api/scada-data', methods=['GET'])
def get_scada_data():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        
        # 1. Fetch latest 1-minute readings for the bar chart
        query_latest = """
            SELECT 
                source_db_name, 
                p_code, 
                "P 번호" AS p_number, 
                factory, 
                item, 
                TO_CHAR(dtime_ymdhms, 'YYYY-MM-DD HH24:MI:SS') AS dtime_ymdhms, 
                value 
            FROM "SCADA_data"."SCADA_factory_data_table" 
            WHERE dtime_ymdhms = (SELECT MAX(dtime_ymdhms) FROM "SCADA_data"."SCADA_factory_data_table")
            ORDER BY factory;
        """
        df_latest = pd.read_sql(query_latest, conn)
        latest_records = df_latest.to_dict(orient='records')
        
        # 2. Fetch the last 24 hours of 1-minute data (24 hours * 60 minutes * 3 factories = 4320 rows)
        query_history = """
            SELECT 
                source_db_name, 
                p_code, 
                "P 번호" AS p_number, 
                factory, 
                item, 
                dtime_ymdhms, 
                value 
            FROM "SCADA_data"."SCADA_factory_data_table" 
            ORDER BY dtime_ymdhms DESC 
            LIMIT 4320;
        """
        df_history = pd.read_sql(query_history, conn)
        
        # 3. Resample the history using Pandas to 1-hour averages for each factory
        if not df_history.empty:
            df_history['dtime_ymdhms'] = pd.to_datetime(df_history['dtime_ymdhms'])
            df_history = df_history.sort_values(by='dtime_ymdhms', ascending=True)
            df_resampled = df_history.groupby('factory').resample('1H', on='dtime_ymdhms').agg({
                'source_db_name': 'first',
                'p_code': 'first',
                'p_number': 'first',
                'item': 'first',
                'value': 'mean'
            }).reset_index()
            
            df_resampled['value'] = df_resampled['value'].round().astype(int)
            df_resampled['dtime_ymdhms'] = df_resampled['dtime_ymdhms'].dt.strftime('%Y-%m-%d %H:%M:%S')
            df_resampled = df_resampled.sort_values(by='dtime_ymdhms', ascending=False)
            history_records = df_resampled.to_dict(orient='records')
        else:
            history_records = []
            
        return jsonify({
            "status": "success",
            "latest": latest_records,
            "history": history_records
        })
        
    except Exception as e:
        print(f"Error fetching SCADA data from DB: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
        
    finally:
        if conn:
            conn.close()

@app.route('/api/cseo-members', methods=['GET'])
def get_cseo_members():
    conn = None
    try:
        conn = psycopg2.connect(**MEMBER_DB_CONFIG)
        query = 'SELECT name, id, job_title, position, "e-mail" AS email, phone_number, division, department, job FROM "CSEO_member_data"."CSEO_member_data_table"'
        df = pd.read_sql(query, conn)
        records = df.to_dict(orient='records')
        return jsonify({
            "status": "success",
            "members": records
        })
    except Exception as e:
        print(f"Error fetching member data from DB: {str(e)}")
        # If database connection fails, load from CSV directly as a fallback
        csv_path = r"c:\Users\zed04\OneDrive\Dokumen\CSEO Data Management System\CSEO_member_dummy.csv"
        if os.path.exists(csv_path):
            try:
                fallback_records = []
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        clean_row = {k.strip(): v.strip() for k, v in row.items()}
                        if 'e-mail' in clean_row:
                            clean_row['email'] = clean_row.pop('e-mail')
                        fallback_records.append(clean_row)
                return jsonify({
                    "status": "success",
                    "source": "csv_fallback",
                    "members": fallback_records
                })
            except Exception as csv_err:
                return jsonify({
                    "status": "error",
                    "message": f"DB Error: {str(e)}, CSV Fallback Error: {str(csv_err)}"
                }), 500
        else:
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
    finally:
        if conn:
            conn.close()

def sync_db_to_csv():
    conn = None
    try:
        conn = psycopg2.connect(**MEMBER_DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute('SELECT name, id, job_title, position, "e-mail", phone_number, division, department, job FROM "CSEO_member_data"."CSEO_member_data_table" ORDER BY division, department, position, name')
            records = cur.fetchall()
            csv_path = r"c:\Users\zed04\OneDrive\Dokumen\CSEO Data Management System\CSEO_member_dummy.csv"
            with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["name", "id", "job_title", "position", "e-mail", "phone_number", "division", "department", "job"])
                for r in records:
                    writer.writerow([val.strip() if isinstance(val, str) else val for val in r])
            print("Successfully synced DB records back to CSEO_member_dummy.csv.")
    except Exception as e:
        print(f"Error syncing DB back to CSV: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.route('/api/admin/verify-password', methods=['POST'])
def verify_admin_password():
    conn = None
    try:
        data = request.get_json()
        if not data or 'password' not in data:
            return jsonify({"status": "error", "message": "Password is required"}), 400
            
        password_input = str(data['password']).strip()
        
        conn = psycopg2.connect(**MEMBER_DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute('SELECT value FROM "CSEO_member_data"."admin_config" WHERE key = \'admin_password\'')
            row = cur.fetchone()
            if row:
                db_password = row[0].strip()
                verified = (password_input == db_password)
                return jsonify({"status": "success", "verified": verified})
            else:
                return jsonify({"status": "success", "verified": (password_input == "1234")})
    except Exception as e:
        print(f"Error in /api/admin/verify-password: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/admin/change-password', methods=['POST'])
def change_admin_password():
    conn = None
    try:
        data = request.get_json()
        if not data or 'current_password' not in data or 'new_password' not in data:
            return jsonify({"status": "error", "message": "Current and new passwords are required"}), 400
            
        curr_pass = str(data['current_password']).strip()
        new_pass = str(data['new_password']).strip()
        
        if not new_pass:
            return jsonify({"status": "error", "message": "New password cannot be empty"}), 400
            
        conn = psycopg2.connect(**MEMBER_DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute('SELECT value FROM "CSEO_member_data"."admin_config" WHERE key = \'admin_password\'')
            row = cur.fetchone()
            db_password = row[0].strip() if row else "1234"
            
            if curr_pass != db_password:
                return jsonify({"status": "error", "message": "현재 비밀번호가 일치하지 않습니다."}), 400
                
            cur.execute(
                """
                INSERT INTO "CSEO_member_data"."admin_config" (key, value)
                VALUES ('admin_password', %s)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                """,
                (new_pass,)
            )
            conn.commit()
            
        return jsonify({"status": "success", "message": "비밀번호가 성공적으로 변경되었습니다."})
    except Exception as e:
        print(f"Error in /api/admin/change-password: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cseo-members', methods=['POST'])
def add_cseo_member():
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400
            
        required = ["name", "id", "job_title", "position", "email", "phone_number", "division", "department", "job"]
        for req in required:
            if req not in data or not str(data[req]).strip():
                return jsonify({"status": "error", "message": f"Field '{req}' is required"}), 400
                
        conn = psycopg2.connect(**MEMBER_DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute('SELECT 1 FROM "CSEO_member_data"."CSEO_member_data_table" WHERE id = %s', (data["id"].strip(),))
            if cur.fetchone():
                return jsonify({"status": "error", "message": f"Member ID '{data['id']}' already exists"}), 400
                
            insert_query = """
            INSERT INTO "CSEO_member_data"."CSEO_member_data_table" 
            (name, id, job_title, position, "e-mail", phone_number, division, department, job)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cur.execute(insert_query, (
                data["name"].strip(),
                data["id"].strip(),
                data["job_title"].strip(),
                data["position"].strip(),
                data["email"].strip(),
                data["phone_number"].strip(),
                data["division"].strip(),
                data["department"].strip(),
                data["job"].strip()
            ))
            conn.commit()
            
        sync_db_to_csv()
        return jsonify({"status": "success", "message": "Member added successfully"})
    except Exception as e:
        print(f"Error in POST /api/cseo-members: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cseo-members/<member_id>', methods=['PUT'])
def update_cseo_member(member_id):
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400
            
        required = ["name", "job_title", "position", "email", "phone_number", "division", "department", "job"]
        for req in required:
            if req not in data or not str(data[req]).strip():
                return jsonify({"status": "error", "message": f"Field '{req}' is required"}), 400
                
        conn = psycopg2.connect(**MEMBER_DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute('SELECT 1 FROM "CSEO_member_data"."CSEO_member_data_table" WHERE id = %s', (member_id,))
            if not cur.fetchone():
                return jsonify({"status": "error", "message": f"Member ID '{member_id}' not found"}), 404
                
            update_query = """
            UPDATE "CSEO_member_data"."CSEO_member_data_table"
            SET name = %s, job_title = %s, position = %s, "e-mail" = %s, phone_number = %s, division = %s, department = %s, job = %s
            WHERE id = %s
            """
            cur.execute(update_query, (
                data["name"].strip(),
                data["job_title"].strip(),
                data["position"].strip(),
                data["email"].strip(),
                data["phone_number"].strip(),
                data["division"].strip(),
                data["department"].strip(),
                data["job"].strip(),
                member_id
            ))
            conn.commit()
            
        sync_db_to_csv()
        return jsonify({"status": "success", "message": "Member updated successfully"})
    except Exception as e:
        print(f"Error in PUT /api/cseo-members/<id>: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cseo-members/<member_id>', methods=['DELETE'])
def delete_cseo_member(member_id):
    conn = None
    try:
        conn = psycopg2.connect(**MEMBER_DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute('SELECT 1 FROM "CSEO_member_data"."CSEO_member_data_table" WHERE id = %s', (member_id,))
            if not cur.fetchone():
                return jsonify({"status": "error", "message": f"Member ID '{member_id}' not found"}), 404
                
            cur.execute('DELETE FROM "CSEO_member_data"."CSEO_member_data_table" WHERE id = %s', (member_id,))
            conn.commit()
            
        sync_db_to_csv()
        return jsonify({"status": "success", "message": "Member deleted successfully"})
    except Exception as e:
        print(f"Error in DELETE /api/cseo-members/<id>: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/chiller/filters', methods=['GET'])
def get_chiller_filters():
    # 냉동기 조회를 위한 지역(source_db_name) 및 공장(factory) 고유 필터 목록 및 매핑 조회
    conn = None
    try:
        conn = psycopg2.connect(**CHILLER_DB_CONFIG)
        with conn.cursor() as cur:
            # 1. 고유 지역 조회
            cur.execute('SELECT DISTINCT "source_db_name" FROM "chiller_data"."chiller_data_table" WHERE "source_db_name" IS NOT NULL ORDER BY "source_db_name";')
            regions = [r[0] for r in cur.fetchall()]
            
            # 2. 고유 공장 조회
            cur.execute('SELECT DISTINCT "factory" FROM "chiller_data"."chiller_data_table" WHERE "factory" IS NOT NULL ORDER BY "factory";')
            factories = [f[0] for f in cur.fetchall()]
            
            # 3. 지역별 실제 존재하는 공장 매핑 조회
            cur.execute('SELECT DISTINCT "source_db_name", "factory" FROM "chiller_data"."chiller_data_table" WHERE "source_db_name" IS NOT NULL AND "factory" IS NOT NULL ORDER BY "source_db_name", "factory";')
            mapping = {}
            for r, f in cur.fetchall():
                if r not in mapping:
                    mapping[r] = []
                mapping[r].append(f)
            
        return jsonify({
            "status": "success",
            "regions": regions,
            "factories": factories,
            "mapping": mapping
        })
    except Exception as e:
        print(f"냉동기 필터 조회 오류: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/chiller/data', methods=['GET'])
def get_chiller_data():
    # 선택된 지역 및 공장 기준 냉동기 집계 및 시계열 트렌드 조회
    conn = None
    try:
        region = request.args.get('region', '').strip()
        factory = request.args.get('factory', '').strip()
        
        if not region or not factory:
            return jsonify({"status": "error", "message": "지역(region)과 공장(factory) 파라미터가 필요합니다."}), 400
            
        conn = psycopg2.connect(**CHILLER_DB_CONFIG)
        
        # 1. 6열 집계 표 쿼리 (특정 지역 및 공장 내 가장 최근 일시인 dtime_ymdhms 시점 기준)
        table_query = """
            SELECT 
                "factory", 
                "temp", 
                "supply", 
                ROUND(SUM("공통_냉동톤")::numeric, 1) AS sum_ton, 
                ROUND(SUM("Total_냉동기전력")::numeric, 1) AS sum_power,
                ROUND(AVG(CASE WHEN "공통_ECI" > 0 THEN "공통_ECI" ELSE NULL END)::numeric, 3) AS avg_eci
            FROM "chiller_data"."chiller_data_table"
            WHERE "source_db_name" = %s 
              AND "factory" = %s
              AND "dtime_ymdhms" = (
                  SELECT MAX("dtime_ymdhms") 
                  FROM "chiller_data"."chiller_data_table" 
                  WHERE "source_db_name" = %s AND "factory" = %s
              )
            GROUP BY "factory", "temp", "supply"
            ORDER BY "factory", "temp", "supply";
        """
        df_table = pd.read_sql(table_query, conn, params=(region, factory, region, factory))
        table_records = df_table.to_dict(orient='records')
        
        # 2. Chart.js 시계열 그래프용 최근 24개 데이터 쿼리 (시간순 정렬)
        chart_query = """
            SELECT 
                TO_CHAR(dtime_ymdhms, 'MM/DD HH24:MI') AS dtime,
                ROUND("공통_냉동톤"::numeric, 1) AS ton,
                ROUND("Total_냉동기전력"::numeric, 1) AS power,
                ROUND("공통_ECI"::numeric, 2) AS eci
            FROM "chiller_data"."chiller_data_table"
            WHERE "source_db_name" = %s AND "factory" = %s
            ORDER BY dtime_ymdhms DESC
            LIMIT 24;
        """
        df_chart = pd.read_sql(chart_query, conn, params=(region, factory))
        # 시간 경과 시각화를 위해 정순 정렬
        df_chart = df_chart.iloc[::-1]
        chart_records = df_chart.to_dict(orient='records')
        
        return jsonify({
            "status": "success",
            "table_data": table_records,
            "chart_data": chart_records
        })
    except Exception as e:
        print(f"냉동기 데이터 조회 오류: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    print("--------------------------------------------------")
    print("Initializing CSEO Group Database...")
    initialize_member_db()
    print("--------------------------------------------------")
    print("SCADA & CSEO Member Database API Server is starting...")
    print("SCADA Endpoint: http://localhost:5000/api/scada-data")
    print("CSEO Members Endpoint: http://localhost:5000/api/cseo-members")
    print("--------------------------------------------------")
    app.run(host='0.0.0.0', port=5000, debug=True)
