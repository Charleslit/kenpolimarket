2025-10-10T10:20:18.299543974Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/fastapi/routing.py", line 294, in app
2025-10-10T10:20:18.299547134Z     raw_response = await run_endpoint_function(
2025-10-10T10:20:18.299549804Z                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.299552404Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/fastapi/routing.py", line 191, in run_endpoint_function
2025-10-10T10:20:18.299554924Z     return await dependant.call(**values)
2025-10-10T10:20:18.299557654Z            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.299561765Z   File "/opt/render/project/src/backend/routers/forecasts.py", line 278, in seed_county_scenario
2025-10-10T10:20:18.299564945Z     db.commit()
2025-10-10T10:20:18.299567435Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1969, in commit
2025-10-10T10:20:18.299570335Z     trans.commit(_to_root=True)
2025-10-10T10:20:18.299572905Z   File "<string>", line 2, in commit
2025-10-10T10:20:18.299575585Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 139, in _go
2025-10-10T10:20:18.299577955Z     ret_value = fn(self, *arg, **kw)
2025-10-10T10:20:18.299580605Z                 ^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.299582875Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1256, in commit
2025-10-10T10:20:18.299585715Z     self._prepare_impl()
2025-10-10T10:20:18.299587875Z   File "<string>", line 2, in _prepare_impl
2025-10-10T10:20:18.299590185Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 139, in _go
2025-10-10T10:20:18.299592555Z     ret_value = fn(self, *arg, **kw)
2025-10-10T10:20:18.299594885Z                 ^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.299597115Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1231, in _prepare_impl
2025-10-10T10:20:18.299599515Z     self.session.flush()
2025-10-10T10:20:18.299602415Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4312, in flush
2025-10-10T10:20:18.299605546Z     self._flush(objects)
2025-10-10T10:20:18.299608736Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4447, in _flush
2025-10-10T10:20:18.299620056Z     with util.safe_reraise():
2025-10-10T10:20:18.299622546Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/util/langhelpers.py", line 146, in __exit__
2025-10-10T10:20:18.299624256Z     raise exc_value.with_traceback(exc_tb)
2025-10-10T10:20:18.299625966Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4408, in _flush
2025-10-10T10:20:18.299627656Z     flush_context.execute()
2025-10-10T10:20:18.299629686Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/unitofwork.py", line 466, in execute
2025-10-10T10:20:18.299631596Z     rec.execute(self)
2025-10-10T10:20:18.299633246Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/unitofwork.py", line 642, in execute
2025-10-10T10:20:18.299634956Z     util.preloaded.orm_persistence.save_obj(
2025-10-10T10:20:18.299636596Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/persistence.py", line 93, in save_obj
2025-10-10T10:20:18.299638276Z     _emit_insert_statements(
2025-10-10T10:20:18.299640427Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/persistence.py", line 1227, in _emit_insert_statements
2025-10-10T10:20:18.299642056Z     result = connection.execute(
2025-10-10T10:20:18.299643696Z              ^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.299645387Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1416, in execute
2025-10-10T10:20:18.299647047Z     return meth(
2025-10-10T10:20:18.299648667Z            ^^^^^
2025-10-10T10:20:18.299650317Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/sql/elements.py", line 517, in _execute_on_connection
2025-10-10T10:20:18.299651987Z     return connection._execute_clauseelement(
2025-10-10T10:20:18.299663327Z            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.299665167Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1639, in _execute_clauseelement
2025-10-10T10:20:18.299669277Z     ret = self._execute_context(
2025-10-10T10:20:18.299671257Z           ^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.299673007Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1848, in _execute_context
2025-10-10T10:20:18.299674687Z     return self._exec_single_context(
2025-10-10T10:20:18.299676327Z            ^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.299678297Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1988, in _exec_single_context
2025-10-10T10:20:18.299679937Z     self._handle_dbapi_exception(
2025-10-10T10:20:18.299681628Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 2344, in _handle_dbapi_exception
2025-10-10T10:20:18.299683348Z     raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
2025-10-10T10:20:18.299684997Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1969, in _exec_single_context
2025-10-10T10:20:18.299686677Z     self.dialect.do_execute(
2025-10-10T10:20:18.299688337Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 922, in do_execute
2025-10-10T10:20:18.299689968Z     cursor.execute(statement, parameters)
2025-10-10T10:20:18.299692438Z sqlalchemy.exc.IntegrityError: (psycopg2.errors.NotNullViolation) null value in column "election_date" of relation "elections" violates not-null constraint
2025-10-10T10:20:18.299694188Z DETAIL:  Failing row contains (21, 2027, Governor, null, Governor Election 2027, 2025-10-10 10:20:18.273974).
2025-10-10T10:20:18.299699368Z 
2025-10-10T10:20:18.299701838Z [SQL: INSERT INTO elections (year, election_type, election_date, description, created_at) VALUES (%(year)s, %(election_type)s, %(election_date)s, %(description)s, %(created_at)s) RETURNING elections.id]
2025-10-10T10:20:18.299704088Z [parameters: {'year': 2027, 'election_type': 'Governor', 'election_date': None, 'description': 'Governor Election 2027', 'created_at': datetime.datetime(2025, 10, 10, 10, 20, 18, 273974)}]
2025-10-10T10:20:18.299706188Z (Background on this error at: https://sqlalche.me/e/20/gkpj)
2025-10-10T10:20:18.30228522Z ERROR:    Exception in ASGI application
2025-10-10T10:20:18.30229723Z Traceback (most recent call last):
2025-10-10T10:20:18.30230158Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1969, in _exec_single_context
2025-10-10T10:20:18.30230596Z     self.dialect.do_execute(
2025-10-10T10:20:18.302309431Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 922, in do_execute
2025-10-10T10:20:18.302312391Z     cursor.execute(statement, parameters)
2025-10-10T10:20:18.302315291Z psycopg2.errors.NotNullViolation: null value in column "election_date" of relation "elections" violates not-null constraint
2025-10-10T10:20:18.302318611Z DETAIL:  Failing row contains (20, 2027, Governor, null, Governor Election 2027, 2025-10-10 10:20:18.188708).
2025-10-10T10:20:18.302321521Z 
2025-10-10T10:20:18.302324221Z 
2025-10-10T10:20:18.302327621Z The above exception was the direct cause of the following exception:
2025-10-10T10:20:18.302330691Z 
2025-10-10T10:20:18.302333871Z Traceback (most recent call last):
2025-10-10T10:20:18.302336851Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/uvicorn/protocols/http/httptools_impl.py", line 419, in run_asgi
2025-10-10T10:20:18.302340151Z     result = await app(  # type: ignore[func-returns-value]
2025-10-10T10:20:18.302343491Z              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302346981Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 84, in __call__
2025-10-10T10:20:18.302350312Z     return await self.app(scope, receive, send)
2025-10-10T10:20:18.302352992Z            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302356042Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/fastapi/applications.py", line 1054, in __call__
2025-10-10T10:20:18.302359162Z     await super().__call__(scope, receive, send)
2025-10-10T10:20:18.302362422Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/applications.py", line 123, in __call__
2025-10-10T10:20:18.302365372Z     await self.middleware_stack(scope, receive, send)
2025-10-10T10:20:18.302368252Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
2025-10-10T10:20:18.302371222Z     raise exc
2025-10-10T10:20:18.302374342Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
2025-10-10T10:20:18.302377412Z     await self.app(scope, receive, _send)
2025-10-10T10:20:18.302380432Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/base.py", line 189, in __call__
2025-10-10T10:20:18.302383342Z     with collapse_excgroups():
2025-10-10T10:20:18.302386332Z   File "/opt/render/project/python/Python-3.11.9/lib/python3.11/contextlib.py", line 158, in __exit__
2025-10-10T10:20:18.302389412Z     self.gen.throw(typ, value, traceback)
2025-10-10T10:20:18.302409923Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/_utils.py", line 91, in collapse_excgroups
2025-10-10T10:20:18.302414213Z     raise exc
2025-10-10T10:20:18.302417933Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/base.py", line 191, in __call__
2025-10-10T10:20:18.302421623Z     response = await self.dispatch_func(request, call_next)
2025-10-10T10:20:18.302424903Z                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302428773Z   File "/opt/render/project/src/backend/middleware.py", line 23, in privacy_middleware
2025-10-10T10:20:18.302432374Z     response = await call_next(request)
2025-10-10T10:20:18.302435763Z                ^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302438843Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/base.py", line 165, in call_next
2025-10-10T10:20:18.302442574Z     raise app_exc
2025-10-10T10:20:18.302445754Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/base.py", line 151, in coro
2025-10-10T10:20:18.302448864Z     await self.app(scope, receive_or_disconnect, send_no_error)
2025-10-10T10:20:18.302452614Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/cors.py", line 91, in __call__
2025-10-10T10:20:18.302456234Z     await self.simple_response(scope, receive, send, request_headers=headers)
2025-10-10T10:20:18.302463674Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/cors.py", line 146, in simple_response
2025-10-10T10:20:18.302467564Z     await self.app(scope, receive, send)
2025-10-10T10:20:18.302470994Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 62, in __call__
2025-10-10T10:20:18.302474315Z     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
2025-10-10T10:20:18.302477824Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/_exception_handler.py", line 64, in wrapped_app
2025-10-10T10:20:18.302480964Z     raise exc
2025-10-10T10:20:18.302484215Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
2025-10-10T10:20:18.302487745Z     await app(scope, receive, sender)
2025-10-10T10:20:18.302491265Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/routing.py", line 762, in __call__
2025-10-10T10:20:18.302495055Z     await self.middleware_stack(scope, receive, send)
2025-10-10T10:20:18.302512345Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/routing.py", line 782, in app
2025-10-10T10:20:18.302516445Z     await route.handle(scope, receive, send)
2025-10-10T10:20:18.302519885Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/routing.py", line 297, in handle
2025-10-10T10:20:18.302523576Z     await self.app(scope, receive, send)
2025-10-10T10:20:18.302526806Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/routing.py", line 77, in app
2025-10-10T10:20:18.302530136Z     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
2025-10-10T10:20:18.302533806Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/_exception_handler.py", line 64, in wrapped_app
2025-10-10T10:20:18.302537376Z     raise exc
2025-10-10T10:20:18.302540056Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
2025-10-10T10:20:18.302542176Z     await app(scope, receive, sender)
2025-10-10T10:20:18.302544226Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/starlette/routing.py", line 72, in app
2025-10-10T10:20:18.302552896Z     response = await func(request)
2025-10-10T10:20:18.302558217Z                ^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302560586Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/fastapi/routing.py", line 299, in app
2025-10-10T10:20:18.302562697Z     raise e
2025-10-10T10:20:18.302564806Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/fastapi/routing.py", line 294, in app
2025-10-10T10:20:18.302566897Z     raw_response = await run_endpoint_function(
2025-10-10T10:20:18.302569027Z                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302571167Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/fastapi/routing.py", line 191, in run_endpoint_function
2025-10-10T10:20:18.302573297Z     return await dependant.call(**values)
2025-10-10T10:20:18.302577007Z            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302580917Z   File "/opt/render/project/src/backend/routers/forecasts.py", line 278, in seed_county_scenario
2025-10-10T10:20:18.302584127Z     db.commit()
2025-10-10T10:20:18.302587487Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1969, in commit
2025-10-10T10:20:18.302590937Z     trans.commit(_to_root=True)
2025-10-10T10:20:18.302594477Z   File "<string>", line 2, in commit
2025-10-10T10:20:18.302597847Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 139, in _go
2025-10-10T10:20:18.302601798Z     ret_value = fn(self, *arg, **kw)
2025-10-10T10:20:18.302604747Z                 ^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302606827Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1256, in commit
2025-10-10T10:20:18.302608948Z     self._prepare_impl()
2025-10-10T10:20:18.302610978Z   File "<string>", line 2, in _prepare_impl
2025-10-10T10:20:18.302613188Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 139, in _go
2025-10-10T10:20:18.302615298Z     ret_value = fn(self, *arg, **kw)
2025-10-10T10:20:18.302617408Z                 ^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302619468Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1231, in _prepare_impl
2025-10-10T10:20:18.302621578Z     self.session.flush()
2025-10-10T10:20:18.302623618Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4312, in flush
2025-10-10T10:20:18.302625738Z     self._flush(objects)
2025-10-10T10:20:18.302627768Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4447, in _flush
2025-10-10T10:20:18.302629868Z     with util.safe_reraise():
2025-10-10T10:20:18.302631948Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/util/langhelpers.py", line 146, in __exit__
2025-10-10T10:20:18.302633988Z     raise exc_value.with_traceback(exc_tb)
2025-10-10T10:20:18.302636038Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4408, in _flush
2025-10-10T10:20:18.302638108Z     flush_context.execute()
2025-10-10T10:20:18.302640178Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/unitofwork.py", line 466, in execute
2025-10-10T10:20:18.302642279Z     rec.execute(self)
2025-10-10T10:20:18.302644348Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/unitofwork.py", line 642, in execute
2025-10-10T10:20:18.302646388Z     util.preloaded.orm_persistence.save_obj(
2025-10-10T10:20:18.302652629Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/persistence.py", line 93, in save_obj
2025-10-10T10:20:18.302654749Z     _emit_insert_statements(
2025-10-10T10:20:18.302657569Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/orm/persistence.py", line 1227, in _emit_insert_statements
2025-10-10T10:20:18.302660049Z     result = connection.execute(
2025-10-10T10:20:18.302663209Z              ^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.302667029Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1416, in execute
2025-10-10T10:20:18.302670569Z     return meth(
2025-10-10T10:20:18.302673799Z            ^^^^^
2025-10-10T10:20:18.302677339Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/sql/elements.py", line 517, in _execute_on_connection
2025-10-10T10:20:18.302680849Z     return connection._execute_clauseelement(
2025-10-10T10:20:18.30270774Z            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.30271195Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1639, in _execute_clauseelement
2025-10-10T10:20:18.30271501Z     ret = self._execute_context(
2025-10-10T10:20:18.30271845Z           ^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.30272238Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1848, in _execute_context
2025-10-10T10:20:18.30272483Z     return self._exec_single_context(
2025-10-10T10:20:18.302726981Z            ^^^^^^^^^^^^^^^^^^^^^^^^^^
2025-10-10T10:20:18.30272907Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1988, in _exec_single_context
2025-10-10T10:20:18.302731201Z     self._handle_dbapi_exception(
2025-10-10T10:20:18.302733501Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 2344, in _handle_dbapi_exception
2025-10-10T10:20:18.302735621Z     raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
2025-10-10T10:20:18.302737741Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1969, in _exec_single_context
2025-10-10T10:20:18.302739871Z     self.dialect.do_execute(
2025-10-10T10:20:18.302741991Z   File "/opt/render/project/src/.venv/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 922, in do_execute
2025-10-10T10:20:18.302744091Z     cursor.execute(statement, parameters)
2025-10-10T10:20:18.302746741Z sqlalchemy.exc.IntegrityError: (psycopg2.errors.NotNullViolation) null value in column "election_date" of relation "elections" violates not-null constraint
2025-10-10T10:20:18.302748861Z DETAIL:  Failing row contains (20, 2027, Governor, null, Governor Election 2027, 2025-10-10 10:20:18.188708).
2025-10-10T10:20:18.302750801Z 
2025-10-10T10:20:18.302754061Z [SQL: INSERT INTO elections (year, election_type, election_date, description, created_at) VALUES (%(year)s, %(election_type)s, %(election_date)s, %(description)s, %(created_at)s) RETURNING elections.id]
2025-10-10T10:20:18.302758081Z [parameters: {'year': 2027, 'election_type': 'Governor', 'election_date': None, 'description': 'Governor Election 2027', 'created_at': datetime.datetime(2025, 10, 10, 10, 20, 18, 188708)}]
2025-10-10T10:20:18.302761781Z (Background on this error at: https://sqlalche.me/e/20/gkpj)