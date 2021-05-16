import numpy as np
import pandas as pd
import gc

import matplotlib.pyplot as plt
from IPython.core.display import HTML

import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

import warnings
warnings.filterwarnings("ignore")
pd.set_option('display.max_columns', 300)
pd.set_option("display.max_rows", 20)

df = pd.read_csv('city_temperature.csv')

#Сommon functions for exploratory data analysis
def get_stats(df):
    """
    Function returns a dataframe with the following stats for each column of df dataframe:
    - Unique_values
    - Percentage of missing values
    - Percentage of zero values
    - Percentage of values in the biggest category
    - data type
    """
    stats = []
    for col in df.columns:
        if df[col].dtype not in ['object', 'str', 'datetime64[ns]']:
            zero_cnt = df[df[col] == 0][col].count() * 100 / df.shape[0]
        else:
            zero_cnt = 0

        stats.append((col, df[col].nunique(),
                      df[col].isnull().sum() * 100 / df.shape[0],
                      zero_cnt,
                      df[col].value_counts(normalize=True, dropna=False).values[0] * 100,
                      df[col].dtype))

    df_stats = pd.DataFrame(stats, columns=['Feature', 'Unique_values',
                                            'Percentage of missing values',
                                            'Percentage of zero values',
                                            'Percentage of values in the biggest category',
                                            'type'])

    del stats
    gc.collect()

    return df_stats

del df['State']

df['Month'] = df['Month'].astype('int8')
df['Day'] = df['Day'].astype('int8')
df['Year'] = df['Year'].astype('int16')
df['AvgTemperature'] = df['AvgTemperature'].astype('float16')

df[df['Day']==0].head()

df['Year'].value_counts().sort_index()

df = df[df['Day']!=0]
df = df[~df['Year'].isin([200,201,2020])]
df = df.drop_duplicates()

df[df['Country']=='Equador'].groupby('Year')['AvgTemperature'].agg(['size','min','max','mean'])

df['AvgTemperature'].value_counts(normalize=True).head(5)

dfr = df[df['AvgTemperature']==-99]['Region'].reset_index().drop('index', axis=1)

df = df[df['AvgTemperature']!=-99]

df['days_in_year']=df.groupby(['Country','Year'])['Day'].transform('size')
df[df['days_in_year']<=270]

df=df[df['days_in_year']>270]

df['Date'] = pd.to_datetime(df[['Year','Month', 'Day']])
df['AvgTemperature'] = (df['AvgTemperature'] -32)*(5/9)

code_dict = {'Czech Republic':'Czechia','Equador':'Ecuador', 'Ivory Coast':"Côte d'Ivoire",'Myanmar (Burma)':'Myanmar','Serbia-Montenegro':'Serbia', 'The Netherlands':'Netherlands'}
df['Country'].replace(code_dict, inplace=True)

iso_code = pd.read_csv('iso_codes.csv')
iso_code = iso_code[['Country','ISO_Code']].drop_duplicates().reset_index(drop=True)
iso_code.head()

# temperature stats, grouped by country and year
dfc = (
       df.groupby(['Year','Country'])['AvgTemperature'].agg(['mean'])
      .reset_index()
      .rename(columns={'mean': 'AvgTemperature'})
      .merge(iso_code,left_on='Country',right_on='Country')
      .sort_values(by=['Year','Country'])
      )
dfc['Rank_hottest'] = dfc.groupby(by=['Year'])['AvgTemperature'].rank(method="min",ascending=False)
dfc['Rank_coldest'] = dfc.groupby(by=['Year'])['AvgTemperature'].rank(method="min",ascending=True)
dfc.head()

fig = make_subplots(
     rows=1
    ,cols=2
    ,vertical_spacing=0.15
    ,specs=[[{"type": "choropleth"},{"type": "table"}]]
    ,subplot_titles=['Evolución del cambio climático global a través de los años','Países con mayor cambio climático']
)

map = (
   px.choropleth(
                 dfc               
                ,locations='ISO_Code'               
                ,color='AvgTemperature'
                ,hover_name='Country'  
                ,hover_data={'ISO_Code':False, 'Year':True,'AvgTemperature':':.2f'}
                ,animation_frame='Year'   
                ,color_continuous_scale=[
                    [0, 'rgb(69,117,180)'],
                    [0.14, 'rgb(116,173,209)'],
                    [0.28, 'rgb(171,217,233)'],
                    [0.42, 'rgb(224,243,248)'],
                    [0.56, 'rgb(254,224,144)'],
                    [0.70, 'rgb(253,174,97)'],
                    [0.84, 'rgb(244,109,67)'],
                    [1, 'rgb(215,48,39)']
                    ]
                ,height=600)
  .update_layout(
                 title_text=''
                ,title_x=0.3
                ,margin=dict(r=10, t=40, b=10, l=10)
                ,coloraxis_colorbar_title='Temp °C'
                ,updatemenus=[dict(type="buttons",
                          buttons=[dict(label="Play",
                                        method="animate",
                                        args=[None])])])
)


fig.add_trace(
    map.data[0],
    row=1, col=1
)
fig.update_layout(coloraxis=dict(colorscale=[
                    [0, 'rgb(69,117,180)'],
                    [0.14, 'rgb(116,173,209)'],
                    [0.28, 'rgb(171,217,233)'],
                    [0.42, 'rgb(224,243,248)'],
                    [0.56, 'rgb(254,224,144)'],
                    [0.70, 'rgb(253,174,97)'],
                    [0.84, 'rgb(244,109,67)'],
                    [1, 'rgb(215,48,39)']
                    ]))


fig.show()
fig.write_html("proyect.html")

